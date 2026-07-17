export type IncassoStartParams = {
	agreementId: string | null;
	checkoutSessionId: string | null;
};

export type IncassoCheckoutMode = 'complete' | 'checkout';

export type IncassoStartFlowResult =
	| { status: 'error'; message: string }
	| { status: 'success' }
	| { status: 'redirect'; url: string };

export type IncassoStartFlowDeps = {
	readMagicLinkUrlError: () => string | null;
	consumeMagicLinkFromUrl: () => Promise<{ ok: boolean; error?: string }>;
	getSession: () => Promise<{ session: unknown | null }>;
	invokeCreateSubscriptionCheckout: (body: Record<string, string>) => Promise<{ data: unknown; error: unknown }>;
	getFunctionErrorMessage: (data: unknown, error: unknown, fallback: string) => Promise<string>;
};

export function parseIncassoStartParams(params: URLSearchParams): IncassoStartParams {
	return {
		agreementId: params.get('agreement'),
		checkoutSessionId: params.get('session_id'),
	};
}

export function resolveMissingAgreementError(): string {
	return 'Ongeldige uitnodigingslink (overeenkomst ontbreekt).';
}

export function resolveMissingSessionError(): string {
	return 'Geen actieve sessie. Open de link uit de mail opnieuw.';
}

export function resolveMissingCheckoutUrlError(): string {
	return 'Geen checkout-URL ontvangen.';
}

export function resolveIncassoCheckoutMode(checkoutSessionId: string | null): IncassoCheckoutMode {
	return checkoutSessionId ? 'complete' : 'checkout';
}

export function buildIncassoCheckoutInvokeBody(
	agreementId: string,
	mode: IncassoCheckoutMode,
	checkoutSessionId: string | null,
): Record<string, string> {
	if (mode === 'complete') {
		return {
			lesson_agreement_id: agreementId,
			mode: 'complete',
			checkout_session_id: checkoutSessionId ?? '',
		};
	}
	return { lesson_agreement_id: agreementId, mode: 'checkout' };
}

export function extractCheckoutRedirectUrl(data: unknown): string | null {
	const url = (data as { url?: string } | null)?.url;
	return url ?? null;
}

export function hasInvokeResponseError(data: unknown, error: unknown): boolean {
	const dataError = typeof data === 'object' && data !== null && 'error' in data ? data.error : null;
	return Boolean(error) || typeof dataError === 'string';
}

export function resolveIncassoCompleteFallbackError(): string {
	return 'Kon incasso niet afronden.';
}

export function resolveIncassoCheckoutFallbackError(): string {
	return 'Kon incasso niet starten.';
}

export async function runIncassoStartFlow(
	params: URLSearchParams,
	deps: IncassoStartFlowDeps,
): Promise<IncassoStartFlowResult> {
	const { agreementId, checkoutSessionId } = parseIncassoStartParams(params);
	if (!agreementId) {
		return { status: 'error', message: resolveMissingAgreementError() };
	}

	const hashError = deps.readMagicLinkUrlError();
	if (hashError) {
		return { status: 'error', message: hashError };
	}

	const linkResult = await deps.consumeMagicLinkFromUrl();
	if (!linkResult.ok) {
		return { status: 'error', message: linkResult.error ?? 'Inloggen mislukt.' };
	}

	const sessionResult = await deps.getSession();
	if (!sessionResult.session) {
		return { status: 'error', message: resolveMissingSessionError() };
	}

	const mode = resolveIncassoCheckoutMode(checkoutSessionId);
	const { data, error: invokeErr } = await deps.invokeCreateSubscriptionCheckout(
		buildIncassoCheckoutInvokeBody(agreementId, mode, checkoutSessionId),
	);
	if (hasInvokeResponseError(data, invokeErr)) {
		const fallback =
			mode === 'complete' ? resolveIncassoCompleteFallbackError() : resolveIncassoCheckoutFallbackError();
		const message = await deps.getFunctionErrorMessage(data, invokeErr, fallback);
		return { status: 'error', message };
	}

	if (mode === 'complete') {
		return { status: 'success' };
	}

	const url = extractCheckoutRedirectUrl(data);
	if (!url) {
		return { status: 'error', message: resolveMissingCheckoutUrlError() };
	}

	return { status: 'redirect', url };
}
