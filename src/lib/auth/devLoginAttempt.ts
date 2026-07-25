import { supabase } from '@/integrations/supabase/client';
import { getDevLoginErrorMessage, resolveDevLoginEmail } from '@/lib/auth/devLoginHelpers';
import { resolveDevLoginCredentials, shouldBlockDevLoginInProduction } from '@/lib/auth/devLoginHookHelpers';

export type DevLoginAttemptResult = { ok: true } | { ok: false; error: string };

export async function runDevLoginAttempt(
	selectedValue: string,
	valueOverride?: string,
): Promise<DevLoginAttemptResult> {
	if (shouldBlockDevLoginInProduction()) {
		console.error('Dev login attempted in production - this should never happen');
		return { ok: false, error: 'Dev login is disabled in production' };
	}

	const email = resolveDevLoginEmail(valueOverride || selectedValue);
	const credentials = resolveDevLoginCredentials(email);
	if (credentials.ok === false) {
		return { ok: false, error: credentials.error };
	}

	const { data, error: signInError } = await supabase.auth.signInWithPassword({
		email: credentials.email,
		password: credentials.password,
	});
	if (signInError) {
		return { ok: false, error: getDevLoginErrorMessage(signInError.message, credentials.email) };
	}

	if (data?.user) {
		return { ok: true };
	}

	return { ok: false, error: 'Inloggen mislukt' };
}
