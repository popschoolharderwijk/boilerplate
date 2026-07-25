import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { runAuthCallback } from '@/lib/auth/authCallbackHelpers';
import { readMagicLinkUrlError } from '@/lib/auth/magicLink';

export default function AuthCallback() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = async () => {
			const outcome = await runAuthCallback({
				readHashError: readMagicLinkUrlError,
				getLocationHref: () => window.location.href,
				getLocationHash: () => window.location.hash,
				verifyOtp: (tokenHash) => supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' }),
				exchangeCodeForSession: (href) => supabase.auth.exchangeCodeForSession(href),
			});

			if (outcome.kind === 'error') {
				setError(outcome.message);
				return;
			}

			navigate('/', { replace: true });
		};

		void handleCallback();
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
