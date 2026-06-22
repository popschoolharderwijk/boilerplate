// Generates invoices (one per student) for a given incasso batch.
// - Creates `invoices` + `invoice_lines` rows
// - Renders a Mplifi-styled PDF using pdf-lib
// - Uploads to private 'invoices' storage bucket
// - Sends invoice email with PDF attachment via Resend
//
// Body: { batch_id: string, send_email?: boolean }
// Auth: requires admin JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { beginAuthenticatedPostRequest, jsonResponse } from '../_shared/http.ts';

interface Body {
	batch_id: string;
	send_email?: boolean;
}

interface BatchItem {
	id: string;
	student_user_id: string;
	amount_cents: number;
	remittance_info: string;
	lesson_agreement_id: string | null;
}

interface StudentInfo {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string;
	date_of_birth: string | null;
	parent_email: string | null;
	parent_name: string | null;
	debtor_name: string | null;
	debtor_address: string | null;
	debtor_postal_code: string | null;
	debtor_city: string | null;
	debtor_info_same_as_student: boolean;
}

const ORANGE = rgb(0.976, 0.451, 0.086); // #F97316
const GRAY_TEXT = rgb(0.3, 0.3, 0.3);
const BLACK = rgb(0.1, 0.1, 0.1);

function ageAtDate(dob: string | null, date: string): 'under_21' | '21_plus' | 'unknown' {
	if (!dob) return 'unknown';
	const d = new Date(date);
	const b = new Date(dob);
	let age = d.getFullYear() - b.getFullYear();
	const m = d.getMonth() - b.getMonth();
	if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
	return age >= 21 ? '21_plus' : 'under_21';
}

function fmtEUR(cents: number): string {
	return (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
}

function fmtDateNL(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function buildPdf(args: {
	settings: Record<string, unknown>;
	invoiceNumber: string;
	issueDate: string;
	dueDate: string;
	periodStart: string | null;
	periodEnd: string | null;
	student: StudentInfo;
	mandateRef: string | null;
	lines: Array<{
		description: string;
		lesson_date: string | null;
		quantity: number;
		unit_price_cents: number;
		btw_rate: number;
		amount_excl_btw_cents: number;
		btw_amount_cents: number;
		amount_total_cents: number;
	}>;
	totals: { excl: number; btw21: number; btw0: number; total: number };
}): Promise<Uint8Array> {
	const {
		settings: s,
		invoiceNumber,
		issueDate,
		dueDate,
		periodStart,
		periodEnd,
		student,
		mandateRef,
		lines,
		totals,
	} = args;
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([595.28, 841.89]); // A4
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const W = page.getWidth();
	const margin = 40;

	// Orange header band
	page.drawRectangle({ x: 0, y: 791, width: W, height: 50, color: ORANGE });
	page.drawText(String(s.company_name ?? 'popschool harderwijk'), {
		x: margin,
		y: 808,
		size: 20,
		font: bold,
		color: rgb(1, 1, 1),
	});
	page.drawText('FACTUUR', { x: W - margin - 90, y: 808, size: 20, font: bold, color: rgb(1, 1, 1) });

	// Company block (left)
	let y = 760;
	const companyLines = [
		s.company_address ? String(s.company_address) : null,
		s.company_postcode || s.company_city ? `${s.company_postcode ?? ''} ${s.company_city ?? ''}`.trim() : null,
		s.company_email ? String(s.company_email) : null,
		s.company_phone ? `Tel: ${s.company_phone}` : null,
		s.company_kvk ? `KvK: ${s.company_kvk}` : null,
		s.company_btw_nummer ? `BTW: ${s.company_btw_nummer}` : null,
	].filter((x): x is string => Boolean(x));
	for (const line of companyLines) {
		page.drawText(line, { x: margin, y, size: 9, font, color: GRAY_TEXT });
		y -= 12;
	}

	// Invoice meta (right)
	const metaX = W - margin - 200;
	let metaY = 760;
	const meta: Array<[string, string]> = [
		['Factuurnummer', invoiceNumber],
		['Factuurdatum', fmtDateNL(issueDate)],
		['Vervaldatum', fmtDateNL(dueDate)],
	];
	if (periodStart && periodEnd) meta.push(['Periode', `${fmtDateNL(periodStart)} – ${fmtDateNL(periodEnd)}`]);
	for (const [k, v] of meta) {
		page.drawText(k + ':', { x: metaX, y: metaY, size: 9, font: bold, color: BLACK });
		page.drawText(v, { x: metaX + 90, y: metaY, size: 9, font, color: BLACK });
		metaY -= 13;
	}

	// Bill-to
	y = 660;
	page.drawText('Factuuradres', { x: margin, y, size: 10, font: bold, color: ORANGE });
	y -= 14;
	const useDebtor = !student.debtor_info_same_as_student && student.debtor_name;
	const billName = useDebtor
		? student.debtor_name
		: `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email;
	page.drawText(String(billName ?? ''), { x: margin, y, size: 11, font: bold, color: BLACK });
	y -= 13;
	if (useDebtor) {
		if (student.debtor_address) {
			page.drawText(student.debtor_address, { x: margin, y, size: 10, font, color: BLACK });
			y -= 12;
		}
		if (student.debtor_postal_code || student.debtor_city) {
			page.drawText(`${student.debtor_postal_code ?? ''} ${student.debtor_city ?? ''}`.trim(), {
				x: margin,
				y,
				size: 10,
				font,
				color: BLACK,
			});
			y -= 12;
		}
	}
	page.drawText(student.parent_email ?? student.email, { x: margin, y, size: 10, font, color: GRAY_TEXT });

	// Lines table
	let ty = 580;
	page.drawRectangle({ x: margin, y: ty - 4, width: W - 2 * margin, height: 22, color: rgb(0.96, 0.96, 0.96) });
	page.drawText('Omschrijving', { x: margin + 6, y: ty + 4, size: 9, font: bold, color: BLACK });
	page.drawText('Datum', { x: margin + 280, y: ty + 4, size: 9, font: bold, color: BLACK });
	page.drawText('Aantal', { x: margin + 350, y: ty + 4, size: 9, font: bold, color: BLACK });
	page.drawText('BTW', { x: margin + 400, y: ty + 4, size: 9, font: bold, color: BLACK });
	page.drawText('Bedrag', { x: W - margin - 60, y: ty + 4, size: 9, font: bold, color: BLACK });
	ty -= 22;

	for (const l of lines) {
		page.drawText(l.description.slice(0, 50), { x: margin + 6, y: ty, size: 9, font, color: BLACK });
		page.drawText(l.lesson_date ? fmtDateNL(l.lesson_date) : '—', {
			x: margin + 280,
			y: ty,
			size: 9,
			font,
			color: GRAY_TEXT,
		});
		page.drawText(String(l.quantity), { x: margin + 350, y: ty, size: 9, font, color: BLACK });
		page.drawText(l.btw_rate > 0 ? `${l.btw_rate}%` : 'vrij', {
			x: margin + 400,
			y: ty,
			size: 9,
			font,
			color: BLACK,
		});
		page.drawText(fmtEUR(l.amount_total_cents), { x: W - margin - 60, y: ty, size: 9, font, color: BLACK });
		ty -= 16;
	}

	// Totals box
	ty -= 12;
	const totalsX = W - margin - 200;
	page.drawLine({
		start: { x: totalsX, y: ty + 8 },
		end: { x: W - margin, y: ty + 8 },
		thickness: 0.5,
		color: GRAY_TEXT,
	});
	page.drawText('Subtotaal (excl. BTW)', { x: totalsX, y: ty, size: 9, font, color: BLACK });
	page.drawText(fmtEUR(totals.excl), { x: W - margin - 60, y: ty, size: 9, font, color: BLACK });
	ty -= 14;
	if (totals.btw0 > 0) {
		page.drawText('Vrijgesteld (onderwijs)', { x: totalsX, y: ty, size: 9, font, color: GRAY_TEXT });
		page.drawText(fmtEUR(totals.btw0), { x: W - margin - 60, y: ty, size: 9, font, color: GRAY_TEXT });
		ty -= 14;
	}
	if (totals.btw21 > 0) {
		page.drawText('BTW 21%', { x: totalsX, y: ty, size: 9, font, color: BLACK });
		page.drawText(fmtEUR(totals.btw21), { x: W - margin - 60, y: ty, size: 9, font, color: BLACK });
		ty -= 14;
	}
	page.drawRectangle({ x: totalsX - 6, y: ty - 4, width: W - margin - totalsX + 6, height: 22, color: ORANGE });
	page.drawText('TOTAAL', { x: totalsX, y: ty + 4, size: 11, font: bold, color: rgb(1, 1, 1) });
	page.drawText(fmtEUR(totals.total), { x: W - margin - 60, y: ty + 4, size: 11, font: bold, color: rgb(1, 1, 1) });

	// Payment note
	ty -= 50;
	const ibanStr = String(s.company_iban ?? '');
	const payNote = mandateRef
		? `Dit bedrag wordt automatisch geïncasseerd op of rond ${fmtDateNL(dueDate)} via SEPA-mandaat ${mandateRef}.`
		: `Gelieve het bedrag binnen ${s.invoice_payment_term_days ?? 14} dagen over te maken naar ${ibanStr}.`;
	for (const line of wrap(payNote, 95)) {
		page.drawText(line, { x: margin, y: ty, size: 9, font, color: GRAY_TEXT });
		ty -= 12;
	}

	// Footer
	if (s.invoice_footer_text) {
		page.drawLine({
			start: { x: margin, y: 60 },
			end: { x: W - margin, y: 60 },
			thickness: 0.5,
			color: rgb(0.85, 0.85, 0.85),
		});
		for (const line of wrap(String(s.invoice_footer_text), 110).slice(0, 3)) {
			page.drawText(line, { x: margin, y: 46, size: 8, font, color: GRAY_TEXT });
		}
	}

	return await pdf.save();
}

function wrap(text: string, max: number): string[] {
	const words = text.split(' ');
	const out: string[] = [];
	let cur = '';
	for (const w of words) {
		if ((cur + ' ' + w).trim().length > max) {
			if (cur) out.push(cur);
			cur = w;
		} else {
			cur = (cur + ' ' + w).trim();
		}
	}
	if (cur) out.push(cur);
	return out;
}

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

Deno.serve(async (req) => {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body } = begun;
	if (!body.batch_id) return jsonResponse(400, { error: 'batch_id vereist' });

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

	// Authz: caller must be admin (or service role)
	const token = authHeader.replace(/^Bearer\s+/i, '');
	if (token !== serviceKey) {
		const userClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authHeader } },
			auth: { autoRefreshToken: false, persistSession: false },
		});
		const {
			data: { user },
		} = await userClient.auth.getUser();
		if (!user) return jsonResponse(401, { error: 'Unauthenticated' });
		const { data: roles } = await userClient.from('user_roles').select('role').eq('user_id', user.id);
		const ok = (roles ?? []).some((r) => r.role === 'admin' || r.role === 'site_admin');
		if (!ok) return jsonResponse(403, { error: 'Alleen admins mogen facturen genereren' });
	}

	const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

	const { data: settings, error: sErr } = await admin
		.from('accounting_settings')
		.select('*')
		.eq('id', true)
		.maybeSingle();
	if (sErr || !settings) return jsonResponse(500, { error: 'Accounting-instellingen ontbreken' });

	const { data: batch, error: bErr } = await admin
		.from('incasso_batches')
		.select('*')
		.eq('id', body.batch_id)
		.maybeSingle();
	if (bErr || !batch) return jsonResponse(404, { error: 'Batch niet gevonden' });

	const { data: items, error: iErr } = await admin
		.from('incasso_batch_items')
		.select('id, student_user_id, amount_cents, remittance_info, lesson_agreement_id, mandate_id')
		.eq('batch_id', body.batch_id);
	if (iErr || !items || items.length === 0) return jsonResponse(400, { error: 'Geen regels in deze batch' });

	const studentIds = [...new Set(items.map((i) => i.student_user_id))];
	const [{ data: profiles }, { data: students }, { data: mandates }] = await Promise.all([
		admin.from('profiles').select('user_id, first_name, last_name, email').in('user_id', studentIds),
		admin
			.from('students')
			.select(
				'user_id, date_of_birth, parent_email, parent_name, debtor_info_same_as_student, debtor_name, debtor_address, debtor_postal_code, debtor_city',
			)
			.in('user_id', studentIds),
		admin
			.from('sepa_mandates')
			.select('id, mandate_reference')
			.in(
				'id',
				items.map((i) => (i as { mandate_id: string }).mandate_id),
			),
	]);

	const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
	const studentMap = new Map((students ?? []).map((s) => [s.user_id, s]));
	const mandateMap = new Map((mandates ?? []).map((m) => [m.id, m.mandate_reference]));

	const issueDate = new Date().toISOString().slice(0, 10);
	const dueDate = new Date(
		Date.now() + ((settings as { invoice_payment_term_days?: number }).invoice_payment_term_days ?? 14) * 86400000,
	)
		.toISOString()
		.slice(0, 10);

	const results: Array<{
		student_user_id: string;
		invoice_id?: string;
		invoice_number?: string;
		skipped?: boolean;
		error?: string;
	}> = [];

	for (const sid of studentIds) {
		// Skip if invoice already exists for this batch+student
		const { data: existing } = await admin
			.from('invoices')
			.select('id, invoice_number')
			.eq('batch_id', body.batch_id)
			.eq('student_user_id', sid)
			.maybeSingle();
		if (existing) {
			results.push({
				student_user_id: sid,
				invoice_id: existing.id,
				invoice_number: existing.invoice_number,
				skipped: true,
			});
			continue;
		}

		const profile = profileMap.get(sid);
		const stRow = studentMap.get(sid);
		if (!profile) {
			results.push({ student_user_id: sid, error: 'Geen profiel' });
			continue;
		}
		const student: StudentInfo = {
			user_id: sid,
			first_name: profile.first_name,
			last_name: profile.last_name,
			email: profile.email,
			date_of_birth: (stRow as { date_of_birth?: string | null } | undefined)?.date_of_birth ?? null,
			parent_email: (stRow as { parent_email?: string | null } | undefined)?.parent_email ?? null,
			parent_name: (stRow as { parent_name?: string | null } | undefined)?.parent_name ?? null,
			debtor_name: (stRow as { debtor_name?: string | null } | undefined)?.debtor_name ?? null,
			debtor_address: (stRow as { debtor_address?: string | null } | undefined)?.debtor_address ?? null,
			debtor_postal_code:
				(stRow as { debtor_postal_code?: string | null } | undefined)?.debtor_postal_code ?? null,
			debtor_city: (stRow as { debtor_city?: string | null } | undefined)?.debtor_city ?? null,
			debtor_info_same_as_student:
				(stRow as { debtor_info_same_as_student?: boolean } | undefined)?.debtor_info_same_as_student ?? true,
		};

		const studentItems = items.filter((i) => i.student_user_id === sid) as Array<
			BatchItem & { mandate_id: string }
		>;

		// Build lines with BTW
		const lines = studentItems.map((it) => {
			const lessonDate = (batch as { collection_date: string }).collection_date;
			const cat = ageAtDate(student.date_of_birth, lessonDate);
			const total = it.amount_cents;
			let excl: number, btwAmt: number, rate: number;
			if (cat === '21_plus') {
				rate = 21;
				excl = Math.round(total / 1.21);
				btwAmt = total - excl;
			} else {
				rate = 0;
				excl = total;
				btwAmt = 0;
			}
			return {
				batch_item_id: it.id,
				description: it.remittance_info,
				lesson_date: lessonDate,
				quantity: 1,
				unit_price_cents: total,
				btw_rate: rate,
				amount_excl_btw_cents: excl,
				btw_amount_cents: btwAmt,
				amount_total_cents: total,
			};
		});

		const totals = lines.reduce(
			(acc, l) => {
				acc.excl += l.amount_excl_btw_cents;
				if (l.btw_rate === 21) acc.btw21 += l.btw_amount_cents;
				if (l.btw_rate === 0) acc.btw0 += l.amount_excl_btw_cents;
				acc.total += l.amount_total_cents;
				return acc;
			},
			{ excl: 0, btw21: 0, btw0: 0, total: 0 },
		);

		const hasBtw = lines.some((l) => l.btw_rate === 21);
		const hasExempt = lines.some((l) => l.btw_rate === 0);
		const ageCategory = hasBtw && hasExempt ? 'mixed' : hasBtw ? '21_plus' : hasExempt ? 'under_21' : 'unknown';

		// Next invoice number
		const { data: invNumRaw, error: nErr } = await admin.rpc('next_invoice_number');
		if (nErr || !invNumRaw) {
			results.push({ student_user_id: sid, error: nErr?.message ?? 'next_invoice_number faalde' });
			continue;
		}
		const invoiceNumber = String(invNumRaw);

		// Insert invoice
		const { data: inv, error: insErr } = await admin
			.from('invoices')
			.insert({
				invoice_number: invoiceNumber,
				student_user_id: sid,
				batch_id: body.batch_id,
				issue_date: issueDate,
				due_date: dueDate,
				period_start: (batch as { collection_date: string }).collection_date,
				period_end: (batch as { collection_date: string }).collection_date,
				amount_excl_btw_cents: totals.excl,
				btw_amount_cents: totals.btw21,
				amount_total_cents: totals.total,
				age_category: ageCategory,
				status: 'issued',
			})
			.select('id, invoice_number')
			.single();
		if (insErr || !inv) {
			results.push({ student_user_id: sid, error: insErr?.message ?? 'Invoice insert faalde' });
			continue;
		}

		await admin
			.from('invoice_lines')
			.insert(lines.map((l, idx) => ({ ...l, invoice_id: inv.id, sort_order: idx })));

		const mandateRef = mandateMap.get(studentItems[0].mandate_id) ?? null;

		// PDF
		const pdfBytes = await buildPdf({
			settings: settings as Record<string, unknown>,
			invoiceNumber,
			issueDate,
			dueDate,
			periodStart: (batch as { collection_date: string }).collection_date,
			periodEnd: (batch as { collection_date: string }).collection_date,
			student,
			mandateRef,
			lines,
			totals,
		});

		const storagePath = `${sid}/${inv.id}.pdf`;
		const { error: upErr } = await admin.storage.from('invoices').upload(storagePath, pdfBytes, {
			contentType: 'application/pdf',
			upsert: true,
		});
		if (upErr) {
			results.push({ student_user_id: sid, invoice_id: inv.id, error: `Upload: ${upErr.message}` });
			continue;
		}
		await admin.from('invoices').update({ pdf_storage_path: storagePath }).eq('id', inv.id);

		// Email
		const recipient = student.parent_email || student.email;
		if (body.send_email !== false && recipient) {
			const resendKey = Deno.env.get('RESEND_API_KEY_TRANSACTIONAL') ?? '';
			const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
			if (resendKey && fromEmail) {
				const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#F97316;padding:18px 24px;color:#fff;font-weight:700;font-size:18px">popschool harderwijk</div>
<div style="padding:24px;background:#fff;color:#111">
<p>Beste ${student.first_name ?? 'leerling'},</p>
<p>Hierbij ontvang je factuur <strong>${invoiceNumber}</strong> ten bedrage van <strong>${fmtEUR(totals.total)}</strong>.</p>
${mandateRef ? `<p>Dit bedrag wordt automatisch geïncasseerd op of rond ${fmtDateNL(dueDate)} via SEPA-mandaat ${mandateRef}.</p>` : `<p>Gelieve het bedrag te voldoen vóór ${fmtDateNL(dueDate)}.</p>`}
<p>De factuur is als PDF bijgevoegd. Je kunt 'm ook altijd terugvinden via "Mijn facturen" in het portaal.</p>
<p style="color:#666;font-size:13px;margin-top:24px">Met vriendelijke groet,<br/>${settings.company_name ?? 'popschool harderwijk'}</p>
</div></div>`;
				const resp = await fetch('https://api.resend.com/emails', {
					method: 'POST',
					headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({
						from: fromEmail,
						to: [recipient],
						subject: `Factuur ${invoiceNumber} – ${settings.company_name ?? 'popschool harderwijk'}`,
						html,
						attachments: [{ filename: `${invoiceNumber}.pdf`, content: bytesToBase64(pdfBytes) }],
					}),
				});
				if (resp.ok) {
					await admin
						.from('invoices')
						.update({ sent_at: new Date().toISOString(), email_sent_to: recipient })
						.eq('id', inv.id);
				} else {
					console.error('Resend error', resp.status, await resp.text());
				}
			}
		}

		results.push({ student_user_id: sid, invoice_id: inv.id, invoice_number: invoiceNumber });
	}

	return jsonResponse(200, { ok: true, batch_id: body.batch_id, results });
});
