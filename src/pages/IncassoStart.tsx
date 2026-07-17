import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	StandaloneCenteredPage,
	StandaloneErrorPage,
	StandaloneLoadingPage,
} from '@/components/auth/StandalonePageLayout';
import { supabase } from '@/integrations/supabase/client';
import { consumeMagicLinkFromUrl, getFunctionErrorMessage, readMagicLinkUrlError } from '@/lib/auth/magicLink';

/**
 * Landing page for the magic link from the direct-debit invitation email.
 * 1. Consumes the magic link (PKCE or token_hash) when present in the URL.
 * 2. Calls create-subscription-checkout for the given agreement.
 * 3. Redirects the user to Stripe Checkout (mode `checkout`)
 *    or confirms completion (mode `complete`).
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

			const hashError = readMagicLinkUrlError();
			if (hashError) {
				setError(hashError);
				return;
			}

			const linkResult = await consumeMagicLinkFromUrl();
			if (linkResult.ok === false) {
				setError(linkResult.error);
				return;
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
			<StandaloneCenteredPage narrow>
				<h1 className="font-bold text-2xl">Incasso is ingesteld</h1>
				<p className="text-muted-foreground">
					De betaalmethode is gekoppeld en het abonnement wordt aangemaakt.
				</p>
				<p className="text-muted-foreground text-sm">
					Via het portaal van de Popschool kun je inloggen om al je gegevens over je lidmaatschap, facturen en
					lessen in te zien.
				</p>
				<a
					href="/login"
					className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Naar het Popschool-portaal
				</a>
			</StandaloneCenteredPage>
		);
	}

	if (error) {
		return (
			<StandaloneErrorPage
				title="Incasso starten mislukt"
				message={error}
				actionLabel="Naar inloggen"
				actionHref="/login"
				narrow
			/>
		);
	}

	return <StandaloneLoadingPage message="Bezig met doorsturen naar de betaalomgeving..." />;
}
