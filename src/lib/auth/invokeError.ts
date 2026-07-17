import { FunctionsHttpError } from '@supabase/supabase-js';
import { resolveFunctionsHttpErrorMessage, resolveGenericInvokeErrorMessage } from '@/lib/auth/invokeErrorHelpers';

const DEFAULT_FALLBACK = 'Er is een onbekende fout opgetreden.';

/** Resolve a user-facing message from a Supabase edge-function invoke error. */
export async function getInvokeErrorMessage(
	invokeError: unknown,
	options: { isSiteAdmin?: boolean; fallback?: string } = {},
): Promise<string> {
	const { isSiteAdmin = false, fallback = DEFAULT_FALLBACK } = options;

	if (invokeError instanceof FunctionsHttpError) {
		return resolveFunctionsHttpErrorMessage(invokeError, isSiteAdmin, fallback);
	}

	return resolveGenericInvokeErrorMessage(invokeError, isSiteAdmin, fallback);
}
