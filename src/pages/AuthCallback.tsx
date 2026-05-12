import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getHashError(): string | null {
	if (!window.location.hash.includes('error=')) return null;
	const hashParams = new URLSearchParams(window.location.hash.slice(1));
	const code = hashParams.get('error_code');
	if (code === 'otp_expired') return 'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.';
	return hashParams.get('error_description') ?? 'Inloggen via deze link is mislukt.';
}

export default function AuthCallback() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = async () => {
			const hashError = getHashError();
			if (hashError) {
				setError(hashError);
				return;
			}

			if (window.location.hash.includes('token_hash=')) {
				const hashParams = new URLSearchParams(window.location.hash.slice(1));
				const tokenHash = hashParams.get('token_hash');
				const type = hashParams.get('type') ?? 'email';
				if (!tokenHash || type !== 'email') {
					setError('Ongeldige inloglink. Vraag een nieuwe link aan.');
					return;
				}
				const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
				if (error) {
					setError(error.message);
					return;
				}
				navigate('/', { replace: true });
				return;
			}

			const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

			if (error) {
				setError(error.message);
			} else {
				navigate('/', { replace: true });
			}
		};

		handleCallback();
	}, [navigate]);

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-destructive">Inloggen mislukt</h1>
					<p className="text-muted-foreground">{error}</p>
					<p className="text-sm text-muted-foreground">
						De link is mogelijk verlopen. Probeer opnieuw in te loggen.
					</p>
					<a
						href="/login"
						className="inline-block py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Terug naar inloggen
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<p className="text-muted-foreground">Inloggen...</p>
		</div>
	);
}
