// Public edge function: anyone can submit a signup request without an account.
// Inserts a row into lesson_signup_requests via service role (bypasses RLS for safety),
// after strict validation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface SignupRequest {
	lesson_type_id: string;
	lesson_group_id?: string | null;
	lesson_type_option_id?: string | null;
	first_name: string;
	last_name: string;
	email: string;
	phone_number?: string | null;
	date_of_birth?: string | null;
	parent_name?: string | null;
	parent_email?: string | null;
	parent_phone_number?: string | null;
	notes?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(message: string, status = 400) {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'POST') return bad('Method not allowed', 405);

	let body: SignupRequest;
	try {
		body = await req.json();
	} catch {
		return bad('Invalid JSON');
	}

	if (!body.lesson_type_id || !UUID_RE.test(body.lesson_type_id)) return bad('Ongeldige lessoort');
	if (body.lesson_group_id && !UUID_RE.test(body.lesson_group_id)) return bad('Ongeldige groep');
	if (body.lesson_type_option_id && !UUID_RE.test(body.lesson_type_option_id)) return bad('Ongeldige optie');
	if (!body.first_name?.trim() || !body.last_name?.trim()) return bad('Naam is verplicht');
	if (!body.email || !EMAIL_RE.test(body.email)) return bad('Ongeldig e-mailadres');

	const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	// Validate lesson_type exists and is active
	const { data: lt } = await supabase
		.from('lesson_types')
		.select('id, is_active, is_group_lesson')
		.eq('id', body.lesson_type_id)
		.single();
	if (!lt?.is_active) return bad('Lessoort niet beschikbaar', 404);

	if (body.lesson_group_id) {
		const { data: lg } = await supabase
			.from('lesson_groups')
			.select('id, lesson_type_id, is_active')
			.eq('id', body.lesson_group_id)
			.single();
		if (!lg?.is_active || lg.lesson_type_id !== body.lesson_type_id) return bad('Groep niet beschikbaar', 404);
	}

	let optionId: string | null = null;
	if (body.lesson_type_option_id) {
		if (lt.is_group_lesson) {
			return bad('Optie niet toegestaan voor groepsles', 400);
		}
		const { data: opt } = await supabase
			.from('lesson_type_options')
			.select('id, lesson_type_id')
			.eq('id', body.lesson_type_option_id)
			.single();
		if (!opt || opt.lesson_type_id !== body.lesson_type_id) {
			return bad('Optie niet beschikbaar', 404);
		}
		optionId = opt.id;
	}

	const { data, error } = await supabase
		.from('lesson_signup_requests')
		.insert({
			lesson_type_id: body.lesson_type_id,
			lesson_group_id: body.lesson_group_id ?? null,
			lesson_type_option_id: optionId,
			first_name: body.first_name.trim(),
			last_name: body.last_name.trim(),
			email: body.email.trim().toLowerCase(),
			phone_number: body.phone_number?.trim() || null,
			date_of_birth: body.date_of_birth || null,
			parent_name: body.parent_name?.trim() || null,
			parent_email: body.parent_email?.trim().toLowerCase() || null,
			parent_phone_number: body.parent_phone_number?.trim() || null,
			notes: body.notes?.trim() || null,
			status: 'pending',
		})
		.select('id')
		.single();

	if (error) {
		console.error('signup insert error', error);
		return bad('Kon aanmelding niet opslaan', 500);
	}

	// Verstuur bevestigingsmail (best-effort: faal niet de signup als mail mislukt).
	try {
		const { data: ltName } = await supabase
			.from('lesson_types')
			.select('name')
			.eq('id', body.lesson_type_id)
			.maybeSingle();
		let frequentie = '';
		let prijs = '';
		if (optionId) {
			const { data: opt } = await supabase
				.from('lesson_type_options')
				.select('frequency, price_per_lesson')
				.eq('id', optionId)
				.maybeSingle();
			if (opt) {
				frequentie = String(opt.frequency ?? '');
				prijs =
					opt.price_per_lesson != null
						? `€ ${Number(opt.price_per_lesson).toFixed(2).replace('.', ',')}`
						: '';
			}
		}
		const fullName = `${body.first_name.trim()} ${body.last_name.trim()}`.trim();
		const recipientEmail = (body.parent_email?.trim() || body.email).toLowerCase();
		const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
		const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
		const mailResp = await fetch(`${supabaseUrl}/functions/v1/send-template-email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${serviceKey}`,
			},
			body: JSON.stringify({
				event_key: 'signup_received',
				to: recipientEmail,
				vars: {
					leerling_naam: fullName,
					les_type: ltName?.name ?? '',
					frequentie,
					prijs_per_les: prijs,
				},
			}),
		});
		if (!mailResp.ok) {
			console.error('signup_received mail failed', mailResp.status, await mailResp.text());
		}
	} catch (mailErr) {
		console.error('signup_received mail exception', mailErr);
	}

	return new Response(JSON.stringify({ id: data.id }), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
});
