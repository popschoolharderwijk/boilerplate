// Generates a SEPA pain.008.001.02 (B2C direct debit) XML for an approved
// incasso batch, uploads it to the private `sepa-batches` storage bucket,
// updates the batch row, and returns the storage path.
//
// Auth: admin or site_admin only.
import { createHash } from 'node:crypto';
import { beginAuthenticatedPostWithUuidField, handleCorsPreflight, jsonResponse } from '../_shared/http.ts';
import { requireAuthenticatedClients } from '../_shared/supabase.ts';

interface Body {
	batch_id?: string;
}

interface SettingsRow {
	sepa_creditor_name: string | null;
	sepa_creditor_iban: string | null;
	sepa_creditor_bic: string | null;
	sepa_creditor_id: string | null;
}

interface BatchRow {
	id: string;
	batch_number: string;
	status: string;
	collection_date: string;
	message_id: string | null;
	xml_storage_path: string | null;
}

interface ItemRow {
	id: string;
	mandate_id: string;
	amount_cents: number;
	currency: string;
	end_to_end_id: string;
	remittance_info: string;
	sequence_type: 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';
	sepa_mandates: {
		mandate_reference: string;
		iban: string;
		bic: string | null;
		account_holder: string;
		signed_at: string | null;
	} | null;
}

function xmlEscape(s: string): string {
	return s.replace(/[<>&'"]/g, (c) =>
		c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
	);
}

function fmtAmount(cents: number): string {
	return (cents / 100).toFixed(2);
}

Deno.serve(async (req) => {
	const pf = handleCorsPreflight(req);
	if (pf) return pf;

	const begun = await beginAuthenticatedPostWithUuidField<Body>(req, (b) => b.batch_id, 'batch_id');
	if (!begun.ok) return begun.response;
	const { authHeader, uuid: batchId } = begun;

	const auth = await requireAuthenticatedClients(authHeader);
	if (!auth.ok) return auth.response;
	const { userClient, admin, user } = auth;

	const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
	const role = roleRow?.role;
	if (role !== 'admin' && role !== 'site_admin') {
		return jsonResponse(403, { error: 'Geen rechten' });
	}

	const { data: settings, error: sErr } = await admin
		.from('accounting_settings')
		.select('sepa_creditor_name, sepa_creditor_iban, sepa_creditor_bic, sepa_creditor_id')
		.eq('id', true)
		.maybeSingle();
	if (sErr || !settings) return jsonResponse(500, { error: 'Boekhoud-instellingen ontbreken' });
	const s = settings as SettingsRow;
	if (!s.sepa_creditor_name || !s.sepa_creditor_iban || !s.sepa_creditor_id) {
		return jsonResponse(422, { error: 'Vul eerst alle SEPA-crediteurgegevens in' });
	}

	const { data: batch, error: bErr } = await admin
		.from('incasso_batches')
		.select('id, batch_number, status, collection_date, message_id, xml_storage_path')
		.eq('id', batchId)
		.maybeSingle();
	if (bErr || !batch) return jsonResponse(404, { error: 'Batch niet gevonden' });
	const b = batch as BatchRow;
	if (b.status !== 'approved' && b.status !== 'submitted') {
		return jsonResponse(409, { error: 'Batch is niet goedgekeurd' });
	}

	const { data: itemsData, error: iErr } = await admin
		.from('incasso_batch_items')
		.select(
			'id, mandate_id, amount_cents, currency, end_to_end_id, remittance_info, sequence_type, sepa_mandates!incasso_batch_items_mandate_id_fkey(mandate_reference,iban,bic,account_holder,signed_at)',
		)
		.eq('batch_id', batchId)
		.order('created_at');
	if (iErr) return jsonResponse(500, { error: iErr.message });
	const items = (itemsData ?? []) as unknown as ItemRow[];
	if (items.length === 0) return jsonResponse(422, { error: 'Geen regels in batch' });

	// Group by sequence_type (FRST/RCUR/OOFF/FNAL) — separate PaymentInformation per type
	const groups = new Map<string, ItemRow[]>();
	for (const it of items) {
		const k = it.sequence_type;
		const arr = groups.get(k) ?? [];
		arr.push(it);
		groups.set(k, arr);
	}

	const msgId = b.message_id ?? `MSG-${b.batch_number}-${Date.now()}`;
	const creationDateTime = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
	const totalCents = items.reduce((sum, it) => sum + it.amount_cents, 0);
	const nbOfTxs = items.length;

	const creditorName = xmlEscape(s.sepa_creditor_name);
	const creditorIban = s.sepa_creditor_iban.replace(/\s/g, '');
	const creditorBic = s.sepa_creditor_bic ? xmlEscape(s.sepa_creditor_bic) : null;
	const creditorId = xmlEscape(s.sepa_creditor_id);

	let pmtInfBlocks = '';
	let pmtInfIdx = 0;
	for (const [seqType, group] of groups) {
		pmtInfIdx++;
		const pmtInfId = `${msgId}-PI${pmtInfIdx}`;
		const ctrlSum = group.reduce((sum, it) => sum + it.amount_cents, 0);

		let txBlocks = '';
		for (const it of group) {
			if (!it.sepa_mandates) continue;
			const m = it.sepa_mandates;
			const iban = m.iban.replace(/\s/g, '');
			txBlocks += `
        <DrctDbtTxInf>
          <PmtId><EndToEndId>${xmlEscape(it.end_to_end_id)}</EndToEndId></PmtId>
          <InstdAmt Ccy="${xmlEscape(it.currency || 'EUR')}">${fmtAmount(it.amount_cents)}</InstdAmt>
          <DrctDbtTx>
            <MndtRltdInf>
              <MndtId>${xmlEscape(m.mandate_reference)}</MndtId>
              <DtOfSgntr>${m.signed_at ?? b.collection_date}</DtOfSgntr>
            </MndtRltdInf>
          </DrctDbtTx>
          ${m.bic ? `<DbtrAgt><FinInstnId><BIC>${xmlEscape(m.bic)}</BIC></FinInstnId></DbtrAgt>` : '<DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt>'}
          <Dbtr><Nm>${xmlEscape(m.account_holder)}</Nm></Dbtr>
          <DbtrAcct><Id><IBAN>${xmlEscape(iban)}</IBAN></Id></DbtrAcct>
          <RmtInf><Ustrd>${xmlEscape(it.remittance_info.slice(0, 140))}</Ustrd></RmtInf>
        </DrctDbtTxInf>`;
		}

		pmtInfBlocks += `
    <PmtInf>
      <PmtInfId>${xmlEscape(pmtInfId)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${group.length}</NbOfTxs>
      <CtrlSum>${fmtAmount(ctrlSum)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
        <SeqTp>${seqType}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${b.collection_date}</ReqdColltnDt>
      <Cdtr><Nm>${creditorName}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${xmlEscape(creditorIban)}</IBAN></Id></CdtrAcct>
      ${creditorBic ? `<CdtrAgt><FinInstnId><BIC>${creditorBic}</BIC></FinInstnId></CdtrAgt>` : '<CdtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></CdtrAgt>'}
      <ChrgBr>SLEV</ChrgBr>
      <CdtrSchmeId>
        <Id><PrvtId><Othr><Id>${creditorId}</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id>
      </CdtrSchmeId>${txBlocks}
    </PmtInf>`;
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${xmlEscape(msgId)}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${fmtAmount(totalCents)}</CtrlSum>
      <InitgPty><Nm>${creditorName}</Nm></InitgPty>
    </GrpHdr>${pmtInfBlocks}
  </CstmrDrctDbtInitn>
</Document>`;

	const hash = createHash('sha256').update(xml).digest('hex');
	const path = `${b.batch_number}/${msgId}.xml`;

	const { error: upErr } = await admin.storage
		.from('sepa-batches')
		.upload(path, new Blob([xml], { type: 'application/xml' }), {
			contentType: 'application/xml',
			upsert: true,
		});
	if (upErr) return jsonResponse(500, { error: `Upload mislukt: ${upErr.message}` });

	// Mark mandates first_used_at if not set (for FRST that just got submitted)
	const mandateIdsFRST = items.filter((i) => i.sequence_type === 'FRST').map((i) => i.mandate_id);
	if (mandateIdsFRST.length > 0) {
		await admin
			.from('sepa_mandates')
			.update({ first_used_at: new Date().toISOString(), sequence_type: 'RCUR' })
			.in('id', mandateIdsFRST);
	}

	await admin
		.from('incasso_batches')
		.update({
			message_id: msgId,
			xml_storage_path: path,
			xml_sha256: hash,
		})
		.eq('id', batchId);

	return jsonResponse(200, { ok: true, storage_path: path, message_id: msgId, sha256: hash });
});
