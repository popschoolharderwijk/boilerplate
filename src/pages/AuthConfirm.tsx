import type { EmailOtpType } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandaloneErrorPage, StandaloneLoadingPage } from '@/components/auth/StandalonePageLayout';
import { supabase } from '@/integrations/supabase/client';
import { readMagicLinkUrlError } from '@/lib/auth/magicLink';

const EMAIL_OTP_TYPES = new Set(['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change']);

function getSafeNext(value: string | null): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
	return value;
}

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
			const tokenHash = params.get('token_hash');
			const typeParam = params.get('type') ?? 'email';
			const next = getSafeNext(params.get('next'));

			if (!tokenHash || !EMAIL_OTP_TYPES.has(typeParam)) {
				setError('Ongeldige inloglink. Vraag een nieuwe link aan.');
				return;
			}

			const { error: verifyError } = await supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: typeParam as EmailOtpType,
			});

			if (verifyError) {
				setError(
					verifyError.message.toLowerCase().includes('expired')
						? 'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.'
						: verifyError.message,
				);
				return;
			}

			navigate(next, { replace: true });
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
