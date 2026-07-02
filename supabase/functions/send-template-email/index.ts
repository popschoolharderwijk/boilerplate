// Generic transactional email sender. Loads template from `email_templates`
// by event_key, replaces {{variable}} placeholders, and sends via Resend.
//
// Auth: requires JWT (from a logged-in user) OR service-role (for server-side triggers
// from other edge functions). Anonymous calls are rejected.
//
// When is_enabled=false: silently skip with { skipped: true } — no error.
// When template is missing: 404. On Resend error: 502 with message.
//
// Body: { event_key: string, to: string, vars?: Record<string, string> }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEmailEvent } from '../_shared/email-events.ts';
import { beginAuthenticatedPostRequest, getSiteBaseUrl, jsonResponse, resolveAllowedSiteUrl } from '../_shared/http.ts';

interface SendBody {
	event_key: string;
	to: string;
	vars?: Record<string, string | number | null | undefined>;
	site_url?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildPortalFooter(baseUrl: string, recipient: string): string {
	const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(recipient)}`;
	return `
<div style="margin-top:32px;padding:16px 20px;border-top:1px solid #e5e5e5;font-family:Arial,sans-serif;font-size:13px;color:#555;text-align:center;">
  <p style="margin:0 0 8px;">Log in op het portaal voor meer informatie:</p>
  <p style="margin:0;"><a href="${loginUrl}" style="color:#ea580c;text-decoration:none;font-weight:600;">Open het portaal</a></p>
  <p style="margin:8px 0 0;font-size:11px;color:#999;">Je ontvangt direct een inloglink op ${recipient}.</p>
</div>`;
}

function buildPendingFooter(): string {
	return `
<div style="margin-top:32px;padding:16px 20px;border-top:1px solid #e5e5e5;font-family:Arial,sans-serif;font-size:13px;color:#555;text-align:center;">
  <p style="margin:0;">Je kunt inloggen op het portaal zodra je aanmelding is verwerkt. We nemen zo snel mogelijk contact met je op.</p>
</div>`;
}

function appendFooter(html: string, footer: string): string {
	if (/<\/body>/i.test(html)) {
		return html.replace(/<\/body>/i, `${footer}</body>`);
	}
	return `${html}${footer}`;
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
	const begun = await beginAuthenticatedPostRequest<SendBody>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body } = begun;

	if (!body.event_key || typeof body.event_key !== 'string') return jsonResponse(400, { error: 'event_key vereist' });
	if (!body.to || !EMAIL_RE.test(body.to)) return jsonResponse(400, { error: 'Ongeldig e-mailadres' });

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const resendKey = Deno.env.get('RESEND_API_KEY_TRANSACTIONAL') ?? '';
	const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';

	if (!resendKey || !fromEmail) {
		console.error('Missing RESEND_API_KEY_TRANSACTIONAL or RESEND_FROM_EMAIL');
		return jsonResponse(500, { error: 'Mail-configuratie ontbreekt' });
	}

	// Authz: token may be a user JWT or the service-role key (server-to-server).
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
		if (userErr || !user) return jsonResponse(401, { error: 'Invalid token' });
	}

	const eventDef = getEmailEvent(body.event_key);
	if (!eventDef) return jsonResponse(404, { error: `Onbekend event: ${body.event_key}` });

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
		return jsonResponse(500, { error: 'Kon template niet ophalen' });
	}
	if (!template) return jsonResponse(404, { error: 'Template bestaat niet' });
	if (!template.is_enabled) return jsonResponse(200, { skipped: true, reason: 'template_disabled' });

	const vars = normalizeVars(body.vars);
	const subject = renderTemplate(template.subject, vars);
	const renderedHtml = renderTemplate(template.body_html, vars);

	// Only show the "Open het portaal" link if an account exists for this email.
	// Signup confirmations go out before staff approves the request, so no auth user
	// exists yet and signInWithOtp({ shouldCreateUser: false }) would silently no-op.
	const { data: profile } = await admin.from('profiles').select('user_id').eq('email', body.to).maybeSingle();
	const baseUrl = resolveAllowedSiteUrl(body.site_url) ?? getSiteBaseUrl(req);
	const footer = profile ? buildPortalFooter(baseUrl, body.to) : buildPendingFooter();
	const html = appendFooter(renderedHtml, footer);

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
		return jsonResponse(502, { error: 'Mail-verzending mislukt', detail: errText });
	}

	const result = await resendResp.json().catch(() => ({}));
	return jsonResponse(200, { ok: true, message_id: (result as { id?: string }).id ?? null });
});
