import { FunctionsHttpError } from '@supabase/supabase-js';

const DEFAULT_FALLBACK = 'Er is een onbekende fout opgetreden.';

/** Resolve a user-facing message from a Supabase edge-function invoke error. */
export async function getInvokeErrorMessage(
	invokeError: unknown,
	options: { isSiteAdmin?: boolean; fallback?: string } = {},
): Promise<string> {
	const { isSiteAdmin = false, fallback = DEFAULT_FALLBACK } = options;
	let errorMessage = isSiteAdmin && invokeError instanceof Error ? invokeError.message : fallback;

	if (invokeError instanceof FunctionsHttpError) {
		try {
			const errorBody = await invokeError.context.json();
			const bodyError = typeof errorBody?.error === 'string' ? errorBody.error : null;
			errorMessage = bodyError ?? errorMessage;
		} catch {
			if (isSiteAdmin && invokeError instanceof Error) {
				errorMessage = invokeError.message || String(invokeError);
			}
		}
	} else if (isSiteAdmin && invokeError instanceof Error) {
		errorMessage = invokeError.message || String(invokeError);
	}

	return errorMessage;
}
