import type { EmailOtpType } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandaloneErrorPage, StandaloneLoadingPage } from '@/components/auth/StandalonePageLayout';
import { supabase } from '@/integrations/supabase/client';
import { resolveAuthConfirmParams, resolveVerifyOtpErrorMessage } from '@/lib/auth/authConfirmHelpers';
import { readMagicLinkUrlError } from '@/lib/auth/magicLink';

export default function AuthConfirm() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		const confirm = async () => {
			const hashError = readMagicLinkUrlError();
			if (hashError) {
				setError(hashError);
				return;
			}

			const params = new URLSearchParams(window.location.search);
			const confirmParams = resolveAuthConfirmParams(params);

			if (!confirmParams.isValid) {
				setError('Ongeldige inloglink. Vraag een nieuwe link aan.');
				return;
			}

			const { error: verifyError } = await supabase.auth.verifyOtp({
				token_hash: confirmParams.tokenHash as string,
				type: confirmParams.typeParam as EmailOtpType,
			});

			if (verifyError) {
				setError(resolveVerifyOtpErrorMessage(verifyError.message));
				return;
			}

			navigate(confirmParams.next, { replace: true });
		};

		void confirm();
	}, [navigate]);

	if (error) {
		return (
			<StandaloneErrorPage
				title="Inloggen mislukt"
				message={error}
				actionLabel="Nieuwe link aanvragen"
				actionHref="/login"
			/>
		);
	}

	return <StandaloneLoadingPage message="Inloggen..." />;
}
