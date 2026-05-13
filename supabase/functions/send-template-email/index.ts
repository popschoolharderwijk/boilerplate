// Generieke transactionele mail-verzender. Laadt template uit `email_templates`
// op basis van event_key, vervangt {{variabele}}-placeholders, en stuurt via Resend.
//
// Auth: vereist JWT (van een ingelogde gebruiker) OF service-role (voor server-side triggers
// vanuit andere edge functions). Anonymous calls worden geweigerd.
//
// Bij is_enabled=false: stilletjes overslaan met { skipped: true } — geen fout.
// Bij ontbrekende template: 404. Bij Resend-fout: 502 met bericht.
//
// Body: { event_key: string, to: string, vars?: Record<string, string> }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getEmailEvent } from '../_shared/email-events.ts';

interface SendBody {
	event_key: string;
	to: string;
	vars?: Record<string, string | number | null | undefined>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

function renderTemplate(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
		const value = vars[key];
		return value !== undefined && value !== null ? String(value) : match;
	});
}

function normalizeVars(input: SendBody['vars']): Record<string, string> {
	const out: Record<string, string> = {};
	if (!input) return out;
	for (const [k, v] of Object.entries(input)) {
		if (v === null || v === undefined) continue;
		out[k] = String(v);
	}
	return out;
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return json(401, { error: 'Missing authorization header' });

	let body: SendBody;
	try {
		body = await req.json();
	} catch {
		return json(400, { error: 'Invalid JSON' });
	}

	if (!body.event_key || typeof body.event_key !== 'string') return json(400, { error: 'event_key vereist' });
	if (!body.to || !EMAIL_RE.test(body.to)) return json(400, { error: 'Ongeldig e-mailadres' });

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const resendKey = Deno.env.get('RESEND_API_KEY_TRANSACTIONAL') ?? '';
	const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';

	if (!resendKey || !fromEmail) {
		console.error('Missing RESEND_API_KEY_TRANSACTIONAL or RESEND_FROM_EMAIL');
		return json(500, { error: 'Mail-configuratie ontbreekt' });
	}

	// Authz: token kan een gebruiker-JWT zijn of de service-role key (server-to-server).
	const token = authHeader.replace(/^Bearer\s+/i, '');
	const isServiceRole = token === serviceKey;

	if (!isServiceRole) {
		const userClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authHeader } },
			auth: { autoRefreshToken: false, persistSession: false },
		});
		const {
			data: { user },
			error: userErr,
		} = await userClient.auth.getUser();
		if (userErr || !user) return json(401, { error: 'Invalid token' });
	}

	const eventDef = getEmailEvent(body.event_key);
	if (!eventDef) return json(404, { error: `Onbekend event: ${body.event_key}` });

	const admin = createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const { data: template, error: tErr } = await admin
		.from('email_templates')
		.select('subject, body_html, is_enabled')
		.eq('event_key', body.event_key)
		.maybeSingle();

	if (tErr) {
		console.error('template fetch error', tErr);
		return json(500, { error: 'Kon template niet ophalen' });
	}
	if (!template) return json(404, { error: 'Template bestaat niet' });
	if (!template.is_enabled) return json(200, { skipped: true, reason: 'template_disabled' });

	const vars = normalizeVars(body.vars);
	const subject = renderTemplate(template.subject, vars);
	const html = renderTemplate(template.body_html, vars);

	const resendResp = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${resendKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: fromEmail,
			to: [body.to],
			subject,
			html,
		}),
	});

	if (!resendResp.ok) {
		const errText = await resendResp.text();
		console.error('Resend error', resendResp.status, errText);
		return json(502, { error: 'Mail-verzending mislukt', detail: errText });
	}

	const result = await resendResp.json().catch(() => ({}));
	return json(200, { ok: true, message_id: (result as { id?: string }).id ?? null });
});
