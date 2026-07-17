import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { type LoginState, shouldAutoSendMagicLink, shouldRedirectLoggedInUser } from '@/lib/auth/loginHelpers';
import { resolveLoginOtpVerifyOutcome, resolveLoginStateAfterOtpVerify } from '@/lib/auth/loginOtpHelpers';
import { buildMagicLinkSignInOptions, resolveLoginViewMode } from '@/lib/auth/loginPageHelpers';

export function useLoginPage() {
	const { user, isLoading } = useAuth();
	const [searchParams] = useSearchParams();
	const prefilledEmail = searchParams.get('email') ?? '';
	const [email, setEmail] = useState(prefilledEmail);
	const [otp, setOtp] = useState('');
	const [state, setState] = useState<LoginState>('idle');
	const [error, setError] = useState<string | null>(null);
	const autoSentRef = useRef(false);

	const sendMagicLink = async (target: string) => {
		setError(null);
		setState('sending');
		await supabase.auth.signInWithOtp({
			email: target,
			options: buildMagicLinkSignInOptions(window.location.origin),
		});
		setState('sent');
	};

	useEffect(() => {
		if (!shouldAutoSendMagicLink(autoSentRef.current, isLoading, !!user, prefilledEmail)) return;
		autoSentRef.current = true;
		void supabase.auth
			.signInWithOtp({
				email: prefilledEmail,
				options: buildMagicLinkSignInOptions(window.location.origin),
			})
			.then(() => setState('sent'));
	}, [isLoading, user, prefilledEmail]);

	const verifyOtp = async () => {
		setError(null);
		setState('verifying');
		const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
		const outcome = resolveLoginOtpVerifyOutcome(verifyError);
		if (outcome.kind === 'error') {
			setError(outcome.message);
		}
		setState(resolveLoginStateAfterOtpVerify(outcome));
	};

	const resetOtpFlow = () => {
		setState('idle');
		setOtp('');
	};

	return {
		user,
		isLoading,
		email,
		setEmail,
		otp,
		setOtp,
		state,
		error,
		viewMode: resolveLoginViewMode(state),
		shouldRedirect: shouldRedirectLoggedInUser(isLoading, !!user),
		showLoadingScreen: isLoading,
		sendMagicLink,
		verifyOtp,
		resetOtpFlow,
	};
}
