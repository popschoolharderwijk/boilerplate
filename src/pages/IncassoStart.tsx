import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StandaloneErrorPage, StandaloneLoadingPage } from '@/components/auth/StandalonePageLayout';
import { IncassoStartSuccessPanel } from '@/components/incasso/IncassoStartSuccessPanel';
import { supabase } from '@/integrations/supabase/client';
import { consumeMagicLinkFromUrl, getFunctionErrorMessage, readMagicLinkUrlError } from '@/lib/auth/magicLink';
import { runIncassoStartFlow } from '@/lib/incasso/incassoStartHelpers';

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

		const applyFlowResult = (result: Awaited<ReturnType<typeof runIncassoStartFlow>>) => {
			if (result.status === 'error') {
				setError(result.message);
				return;
			}
			if (result.status === 'success') {
				setSuccess(true);
				return;
			}
			window.location.href = result.url;
		};

		void runIncassoStartFlow(params, {
			readMagicLinkUrlError,
			consumeMagicLinkFromUrl,
			getSession: async () => {
				const { data } = await supabase.auth.getSession();
				return { session: data.session };
			},
			invokeCreateSubscriptionCheckout: (body) =>
				supabase.functions.invoke('create-subscription-checkout', { body }),
			getFunctionErrorMessage,
		}).then(applyFlowResult);
	}, [params]);

	if (success) {
		return <IncassoStartSuccessPanel />;
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

	return <StandaloneLoadingPage message="Incasso starten..." />;
}
