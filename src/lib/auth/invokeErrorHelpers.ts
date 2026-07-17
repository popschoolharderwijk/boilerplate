import type { FunctionsHttpError } from '@supabase/supabase-js';

function extractInvokeErrorBodyMessage(errorBody: unknown): string | null {
	if (typeof errorBody !== 'object' || errorBody === null) return null;
	const bodyError = (errorBody as { error?: unknown }).error;
	return typeof bodyError === 'string' ? bodyError : null;
}

export function resolveGenericInvokeErrorMessage(invokeError: unknown, isSiteAdmin: boolean, fallback: string): string {
	if (isSiteAdmin && invokeError instanceof Error) {
		return invokeError.message || String(invokeError);
	}
	return fallback;
}

export async function resolveFunctionsHttpErrorMessage(
	invokeError: FunctionsHttpError,
	isSiteAdmin: boolean,
	fallback: string,
): Promise<string> {
	let errorMessage = isSiteAdmin ? invokeError.message : fallback;

	try {
		const errorBody = await invokeError.context.json();
		const bodyError = extractInvokeErrorBodyMessage(errorBody);
		errorMessage = bodyError ?? errorMessage;
	} catch {
		errorMessage = resolveGenericInvokeErrorMessage(invokeError, isSiteAdmin, errorMessage);
	}

	return errorMessage;
}
