import type { AuthError } from '@supabase/supabase-js';

export type LoginOtpVerifyOutcome = { kind: 'success' } | { kind: 'error'; message: string };

export function resolveLoginOtpVerifyOutcome(error: AuthError | null): LoginOtpVerifyOutcome {
	if (error) {
		return { kind: 'error', message: error.message };
	}

	return { kind: 'success' };
}

export function resolveLoginStateAfterOtpVerify(outcome: LoginOtpVerifyOutcome): 'sent' | 'verifying' {
	return outcome.kind === 'error' ? 'sent' : 'verifying';
}
