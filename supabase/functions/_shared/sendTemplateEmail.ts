// Server-to-server helper to invoke the `send-template-email` edge function.
// Forwards the caller's original Origin as `site_url` so the portal link in
// the sent email points to the environment where the action was initiated
// (preview vs production), instead of always falling back to the FALLBACK_SITE_URL.

import { resolveAllowedSiteUrl } from './http.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export interface SendTemplateEmailOptions {
	event_key: string;
	to: string;
	vars?: Record<string, string | number | null | undefined>;
	/** Origin header of the request that triggered this send, if any. */
	origin?: string | null;
}

export async function sendTemplateEmail(opts: SendTemplateEmailOptions): Promise<void> {
	const site_url = resolveAllowedSiteUrl(opts.origin) ?? undefined;
	try {
		const resp = await fetch(`${supabaseUrl}/functions/v1/send-template-email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${serviceKey}`,
			},
			body: JSON.stringify({
				event_key: opts.event_key,
				to: opts.to,
				vars: opts.vars ?? {},
				site_url,
			}),
		});
		if (!resp.ok) {
			const text = await resp.text().catch(() => '');
			console.error(`${opts.event_key} mail non-2xx`, resp.status, text);
		}
	} catch (mailErr) {
		console.error(`${opts.event_key} mail`, mailErr);
	}
}
