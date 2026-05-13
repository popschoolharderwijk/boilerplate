import { supabase } from '@/integrations/supabase/client';

/**
 * Helpers voor het verwerken van magic-link landings (PKCE en token_hash).
 * Gebruikt vanuit IncassoStart en eventuele andere magic-link landingspagina's.
 */

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

function getHashParams(): URLSearchParams {
	return new URLSearchParams(window.location.hash.slice(1));
}

/** Leest een Supabase auth-fout uit de URL hash, indien aanwezig. */
export function readMagicLinkUrlError(): string | null {
	if (!window.location.hash.includes('error=')) return null;
	const hashParams = getHashParams();
	const code = hashParams.get('error_code');
	if (code === 'otp_expired') {
		return 'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.';
	}
	return hashParams.get('error_description') ?? 'Inloggen via deze link is mislukt.';
}

/**
 * Wisselt een magic-link uit de URL in voor een actieve sessie.
 * Ondersteunt PKCE (?code=...) en custom token_hash-flow (#token_hash=...&type=email).
 */
export async function consumeMagicLinkFromUrl(): Promise<MagicLinkResult> {
	// PKCE flow: ?code=... in querystring (Supabase default sinds v2).
	if (window.location.search.includes('code=')) {
		const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
		if (error) {
			return { ok: false, error: `Inloggen mislukt: ${error.message}. De link is mogelijk verlopen.` };
		}
		return { ok: true };
	}

	// Custom email-template flow: #token_hash=...&type=email.
	// Voorkomt dat mail-scanners de Supabase ConfirmationURL alvast consumeren.
	if (window.location.hash.includes('token_hash=')) {
		const hashParams = getHashParams();
		const tokenHash = hashParams.get('token_hash');
		const type = hashParams.get('type') ?? 'email';
		if (!tokenHash || type !== 'email') {
			return { ok: false, error: 'Ongeldige uitnodigingslink. Vraag een nieuwe link aan.' };
		}
		const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
		if (error) {
			return { ok: false, error: `Inloggen mislukt: ${error.message}. De link is mogelijk verlopen.` };
		}
		// Ruim hash op zodat tokens niet in browser-history blijven staan.
		window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
		return { ok: true };
	}

	// Geen magic-link parameters in URL: bestaande sessie wordt elders gecontroleerd.
	return { ok: true };
}

/** Leest een fout-veld uit een edge-function respons of Response-object. */
export async function getFunctionErrorMessage(data: unknown, error: unknown, fallback: string): Promise<string> {
	const dataError = typeof data === 'object' && data !== null && 'error' in data ? data.error : null;
	if (typeof dataError === 'string') return dataError;

	const context = typeof error === 'object' && error !== null && 'context' in error ? error.context : null;
	if (context instanceof Response) {
		try {
			const payload: unknown = await context.clone().json();
			const payloadError =
				typeof payload === 'object' && payload !== null && 'error' in payload ? payload.error : null;
			if (typeof payloadError === 'string') return payloadError;
		} catch {
			// Ignore malformed error bodies and fall back below.
		}
	}

	return error instanceof Error ? error.message : fallback;
}
