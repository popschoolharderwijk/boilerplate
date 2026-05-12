import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Landing page voor de magic-link uit de incasso-uitnodigingsmail.
 * 1. Verwerkt de PKCE-code (Supabase Auth) als die in de URL staat.
 * 2. Roept create-subscription-checkout aan voor de meegegeven agreement.
 * 3. Stuurt de gebruiker door naar Stripe Checkout.
 */
export default function IncassoStart() {
	const [params] = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		const run = async () => {
			const agreementId = params.get('agreement');
			if (!agreementId) {
				setError('Ongeldige uitnodigingslink (overeenkomst ontbreekt).');
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
				const hashParams = new URLSearchParams(window.location.hash.slice(1));
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

			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData.session) {
				setError('Geen actieve sessie. Open de link uit de mail opnieuw.');
				return;
			}

			const { data, error: invokeErr } = await supabase.functions.invoke('create-subscription-checkout', {
				body: { lesson_agreement_id: agreementId, mode: 'checkout' },
			});
			if (invokeErr || (data as { error?: string })?.error) {
				setError((data as { error?: string })?.error ?? invokeErr?.message ?? 'Kon incasso niet starten.');
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
