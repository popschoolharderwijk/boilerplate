import type { EmailOtpType } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const EMAIL_OTP_TYPES = new Set(['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change']);

function getSafeNext(value: string | null): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
	return value;
}

function getHashError(): string | null {
	if (!window.location.hash.includes('error=')) return null;
	const hashParams = new URLSearchParams(window.location.hash.slice(1));
	const code = hashParams.get('error_code');
	if (code === 'otp_expired') {
		return 'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.';
	}
	return hashParams.get('error_description') ?? 'Inloggen via deze link is mislukt.';
}

export default function AuthConfirm() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		const confirm = async () => {
			const hashError = getHashError();
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
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="space-y-4 text-center">
					<h1 className="font-bold text-2xl text-destructive">Inloggen mislukt</h1>
					<p className="text-muted-foreground">{error}</p>
					<a
						href="/login"
						className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					>
						Nieuwe link aanvragen
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">Inloggen...</p>
		</div>
	);
}