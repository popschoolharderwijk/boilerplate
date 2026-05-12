import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getHashParams(): URLSearchParams {
	return new URLSearchParams(window.location.hash.slice(1));
}

function getHashError(): string | null {
	if (!window.location.hash.includes('error=')) return null;
	const hashParams = getHashParams();
	const code = hashParams.get('error_code');
	if (code === 'otp_expired') return 'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.';
	return hashParams.get('error_description') ?? 'Inloggen via deze link is mislukt.';
}

async function getFunctionErrorMessage(data: unknown, error: unknown, fallback: string): Promise<string> {
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

/**
 * Landing page voor de magic-link uit de incasso-uitnodigingsmail.
 * 1. Verwerkt de PKCE-code (Supabase Auth) als die in de URL staat.
 * 2. Roept create-subscription-checkout aan voor de meegegeven agreement.
 * 3. Stuurt de gebruiker door naar Stripe Checkout.
 */
export default function IncassoStart() {
	const [params] = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		const run = async () => {
			const agreementId = params.get('agreement');
			const checkoutSessionId = params.get('session_id');
			if (!agreementId) {
				setError('Ongeldige uitnodigingslink (overeenkomst ontbreekt).');
				return;
			}

			const hashError = getHashError();
			if (hashError) {
				setError(hashError);
				return;
			}

			// Variant A: PKCE-code in querystring (?code=...)
			if (window.location.search.includes('code=')) {
				const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
				if (exchangeErr) {
					setError(`Inloggen mislukt: ${exchangeErr.message}. De link is mogelijk verlopen.`);
					return;
				}
			}

			// Variant B: implicit-flow tokens in URL hash (#access_token=...&refresh_token=...)
			// Treedt op als Supabase de magic link via de oude implicit-flow uitlevert
			// (bijvoorbeeld bij verkeerd geconfigureerde Site URL).
			if (window.location.hash.includes('access_token=')) {
				const hashParams = getHashParams();
				const accessToken = hashParams.get('access_token');
				const refreshToken = hashParams.get('refresh_token');
				if (accessToken && refreshToken) {
					const { error: setErr } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});
					if (setErr) {
						setError(`Inloggen mislukt: ${setErr.message}. De link is mogelijk verlopen.`);
						return;
					}
					// Ruim hash op zodat tokens niet in browser-history blijven staan
					window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
				}
			}

			// Variant C: custom email-template met token_hash voorkomt dat mail-scanners
			// de Supabase ConfirmationURL alvast consumeren.
			if (window.location.hash.includes('token_hash=')) {
				const hashParams = getHashParams();
				const tokenHash = hashParams.get('token_hash');
				const type = hashParams.get('type') ?? 'email';
				if (!tokenHash || type !== 'email') {
					setError('Ongeldige uitnodigingslink. Vraag een nieuwe link aan.');
					return;
				}
				const { error: verifyErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
				if (verifyErr) {
					setError(`Inloggen mislukt: ${verifyErr.message}. De link is mogelijk verlopen.`);
					return;
				}
				window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
			}

			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData.session) {
				setError('Geen actieve sessie. Open de link uit de mail opnieuw.');
				return;
			}

			if (checkoutSessionId) {
				const { data, error: completeErr } = await supabase.functions.invoke('create-subscription-checkout', {
					body: {
						lesson_agreement_id: agreementId,
						mode: 'complete',
						checkout_session_id: checkoutSessionId,
					},
				});
				if (completeErr || (data as { error?: string })?.error) {
					setError(await getFunctionErrorMessage(data, completeErr, 'Kon incasso niet afronden.'));
					return;
				}
				setSuccess(true);
				return;
			}

			const { data, error: invokeErr } = await supabase.functions.invoke('create-subscription-checkout', {
				body: { lesson_agreement_id: agreementId, mode: 'checkout' },
			});
			if (invokeErr || (data as { error?: string })?.error) {
				setError(await getFunctionErrorMessage(data, invokeErr, 'Kon incasso niet starten.'));
				return;
			}
			const url = (data as { url?: string })?.url;
			if (!url) {
				setError('Geen checkout-URL ontvangen.');
				return;
			}
			window.location.href = url;
		};

		void run();
	}, [params]);

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="max-w-md space-y-4 text-center">
					<h1 className="font-bold text-2xl">Incasso is ingesteld</h1>
					<p className="text-muted-foreground">
						De betaalmethode is gekoppeld en het abonnement wordt aangemaakt.
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="max-w-md space-y-4 text-center">
					<h1 className="font-bold text-2xl text-destructive">Incasso starten mislukt</h1>
					<p className="text-muted-foreground">{error}</p>
					<a
						href="/login"
						className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					>
						Naar inloggen
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">Bezig met doorsturen naar de betaalomgeving...</p>
		</div>
	);
}
