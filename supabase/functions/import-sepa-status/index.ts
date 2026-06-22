// Verwerkt een SEPA pain.002.001 status-rapport van de bank en werkt de
// statussen van incasso_batch_items (en eventueel de batch / mandaten) bij.
//
// Body (application/json):
//   {
//     "xml": "<Document...>...</Document>",   // verplicht: ruwe pain.002 XML
//     "batch_id"?: "uuid"                      // optioneel: forceer batch indien OrgnlMsgId niet matcht
//   }
//
// Auth: admin of site_admin.
//
// Mapping pain.002 TxSts -> incasso_batch_items.status:
//   ACSC / ACCC / ACSP / ACCP / ACWC  -> 'accepted'
//   RJCT                              -> 'rejected'
//   PDNG / overige                    -> 'submitted' (laten staan)
//
// Bij volledige succes-set (>=1 item, alle items accepted of reversed) wordt
// de batch op 'closed' gezet. Mandaten met sequence_type 'FRST' die geslaagd
// zijn worden naar 'RCUR' gepromoveerd en first_used_at gezet.

import { XMLParser } from 'npm:fast-xml-parser@4.5.0';
import { beginAuthenticatedPostRequest, jsonResponse } from '../_shared/http.ts';
import { requireAuthenticatedClients, requireUserRole } from '../_shared/supabase.ts';

interface Body {
	xml?: string;
	batch_id?: string;
}

interface TxResult {
	end_to_end_id: string;
	status: 'accepted' | 'rejected' | 'submitted';
	reason_code: string | null;
}

interface ParsedReport {
	message_id: string | null;
	original_message_id: string | null;
	group_status: string | null;
	transactions: TxResult[];
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
	if (v === undefined || v === null) return [];
	return Array.isArray(v) ? v : [v];
}

function mapTxSts(code: string): 'accepted' | 'rejected' | 'submitted' {
	const upper = code.toUpperCase();
	if (upper === 'RJCT') return 'rejected';
	if (['ACSC', 'ACCC', 'ACSP', 'ACCP', 'ACWC'].includes(upper)) return 'accepted';
	return 'submitted';
}

function extractReason(tx: Record<string, unknown>): string | null {
	const sri = tx.StsRsnInf as Record<string, unknown> | undefined;
	if (!sri) return null;
	const rsn = sri.Rsn as Record<string, unknown> | undefined;
	if (!rsn) return null;
	const cd = (rsn.Cd ?? rsn.Prtry) as string | undefined;
	return cd ?? null;
}

function parsePain002(xml: string): ParsedReport {
	const parser = new XMLParser({
		ignoreAttributes: true,
		removeNSPrefix: true,
		parseTagValue: false,
		trimValues: true,
	});
	const doc = parser.parse(xml) as Record<string, unknown>;
	const root = (doc.Document ?? doc) as Record<string, unknown>;
	const cstmrPmtStsRpt = root.CstmrPmtStsRpt as Record<string, unknown> | undefined;
	if (!cstmrPmtStsRpt) {
		throw new Error('Geen CstmrPmtStsRpt gevonden — is dit een pain.002-bestand?');
	}

	const grpHdr = cstmrPmtStsRpt.GrpHdr as Record<string, unknown> | undefined;
	const message_id = (grpHdr?.MsgId as string | undefined) ?? null;

	const orgnlGrpInfAndSts = cstmrPmtStsRpt.OrgnlGrpInfAndSts as Record<string, unknown> | undefined;
	const original_message_id = (orgnlGrpInfAndSts?.OrgnlMsgId as string | undefined) ?? null;
	const group_status = (orgnlGrpInfAndSts?.GrpSts as string | undefined) ?? null;

	const transactions: TxResult[] = [];
	const paymentInfos = asArray(cstmrPmtStsRpt.OrgnlPmtInfAndSts as unknown);

	for (const pmt of paymentInfos) {
		const pmtRec = pmt as Record<string, unknown>;
		const txs = asArray(pmtRec.TxInfAndSts as unknown);
		for (const tx of txs) {
			const txRec = tx as Record<string, unknown>;
			const eteId = txRec.OrgnlEndToEndId as string | undefined;
			const sts = txRec.TxSts as string | undefined;
			if (!eteId || !sts) continue;
			transactions.push({
				end_to_end_id: eteId,
				status: mapTxSts(sts),
				reason_code: extractReason(txRec),
			});
		}
	}

	return { message_id, original_message_id, group_status, transactions };
}

Deno.serve(async (req) => {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body } = begun;

	if (!body.xml || typeof body.xml !== 'string' || body.xml.length < 50) {
		return jsonResponse(400, { error: 'Verplicht veld ontbreekt: xml (pain.002 inhoud)' });
	}
	if (body.xml.length > 5 * 1024 * 1024) {
		return jsonResponse(413, { error: 'XML te groot (max 5MB)' });
	}

	const clients = await requireAuthenticatedClients(authHeader);
	if (!clients.ok) return clients.response;
	const { userClient, admin, user } = clients;

	const roleCheck = await requireUserRole(userClient, user.id, ['admin', 'site_admin']);
	if (roleCheck) return roleCheck;

	let report: ParsedReport;
	try {
		report = parsePain002(body.xml);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Onbekende parse-fout';
		return jsonResponse(400, { error: `XML ongeldig: ${msg}` });
	}

	// Zoek de batch: voorkeur op original_message_id, anders op meegegeven batch_id.
	let batchQuery = admin.from('incasso_batches').select('id, message_id, status').limit(1);
	if (report.original_message_id) {
		batchQuery = batchQuery.eq('message_id', report.original_message_id);
	} else if (body.batch_id) {
		batchQuery = batchQuery.eq('id', body.batch_id);
	} else {
		return jsonResponse(400, {
			error: 'Kon batch niet bepalen: geen OrgnlMsgId in XML en geen batch_id meegegeven',
		});
	}

	const { data: batch, error: batchErr } = await batchQuery.maybeSingle();
	if (batchErr) return jsonResponse(500, { error: batchErr.message });
	if (!batch) {
		return jsonResponse(404, {
			error: `Geen batch gevonden voor MsgId=${report.original_message_id ?? body.batch_id}`,
		});
	}

	// Haal alle items van de batch op (voor lookup op end_to_end_id).
	const { data: items, error: itemsErr } = await admin
		.from('incasso_batch_items')
		.select('id, end_to_end_id, mandate_id, status, sequence_type')
		.eq('batch_id', batch.id);
	if (itemsErr) return jsonResponse(500, { error: itemsErr.message });

	const itemMap = new Map((items ?? []).map((i) => [i.end_to_end_id, i]));

	const now = new Date().toISOString();
	let acceptedCount = 0;
	let rejectedCount = 0;
	const unknown: string[] = [];
	const mandatesToPromote = new Set<string>();

	for (const tx of report.transactions) {
		const item = itemMap.get(tx.end_to_end_id);
		if (!item) {
			unknown.push(tx.end_to_end_id);
			continue;
		}
		if (tx.status === 'submitted') continue;

		const { error: updErr } = await admin
			.from('incasso_batch_items')
			.update({
				status: tx.status,
				reason_code: tx.reason_code,
				status_updated_at: now,
			})
			.eq('id', item.id);
		if (updErr) {
			return jsonResponse(500, { error: `Update item ${item.id} faalde: ${updErr.message}` });
		}

		if (tx.status === 'accepted') {
			acceptedCount++;
			if (item.sequence_type === 'FRST') {
				mandatesToPromote.add(item.mandate_id);
			}
		} else if (tx.status === 'rejected') {
			rejectedCount++;
		}
	}

	// Promoot mandaten van FRST naar RCUR + zet first_used_at.
	if (mandatesToPromote.size > 0) {
		const { error: mandateErr } = await admin
			.from('sepa_mandates')
			.update({ sequence_type: 'RCUR', first_used_at: now, status: 'active' })
			.in('id', Array.from(mandatesToPromote))
			.eq('sequence_type', 'FRST');
		if (mandateErr) {
			console.error('Mandaat-promotie faalde', mandateErr);
		}
	}

	// Sluit batch wanneer er geen items meer in 'submitted' of 'pending' staan.
	const { data: remaining, error: remainingErr } = await admin
		.from('incasso_batch_items')
		.select('id', { count: 'exact', head: true })
		.eq('batch_id', batch.id)
		.in('status', ['pending', 'submitted']);
	if (!remainingErr && (remaining as unknown as { count?: number } | null)) {
		// no-op: head:true levert count via response separat, hieronder nogmaals correct opvragen.
	}

	const { count: openCount } = await admin
		.from('incasso_batch_items')
		.select('id', { count: 'exact', head: true })
		.eq('batch_id', batch.id)
		.in('status', ['pending', 'submitted']);

	let batchClosed = false;
	if ((openCount ?? 0) === 0 && batch.status === 'submitted') {
		const { error: closeErr } = await admin
			.from('incasso_batches')
			.update({ status: 'closed', closed_at: now })
			.eq('id', batch.id);
		if (!closeErr) batchClosed = true;
	}

	return jsonResponse(200, {
		batch_id: batch.id,
		message_id: report.message_id,
		original_message_id: report.original_message_id,
		group_status: report.group_status,
		processed: report.transactions.length,
		accepted: acceptedCount,
		rejected: rejectedCount,
		unknown_end_to_end_ids: unknown,
		mandates_promoted: mandatesToPromote.size,
		batch_closed: batchClosed,
	});
});
