import { describe, expect, it } from 'bun:test';
import {
	buildIncassoCheckoutInvokeBody,
	extractCheckoutRedirectUrl,
	hasInvokeResponseError,
	parseIncassoStartParams,
	resolveIncassoCheckoutFallbackError,
	resolveIncassoCheckoutMode,
	resolveIncassoCompleteFallbackError,
	resolveMissingAgreementError,
	resolveMissingCheckoutUrlError,
	resolveMissingSessionError,
	runIncassoStartFlow,
} from '../../../src/lib/incasso/incassoStartHelpers';

describe('parseIncassoStartParams', () => {
	it('reads agreement and session id from search params', () => {
		const params = new URLSearchParams('agreement=agr-1&session_id=sess-1');
		expect(parseIncassoStartParams(params)).toEqual({
			agreementId: 'agr-1',
			checkoutSessionId: 'sess-1',
		});
	});
});

describe('resolveIncassoCheckoutMode', () => {
	it('returns complete when session id is present', () => {
		expect(resolveIncassoCheckoutMode('sess-1')).toBe('complete');
	});

	it('returns checkout when session id is missing', () => {
		expect(resolveIncassoCheckoutMode(null)).toBe('checkout');
	});
});

describe('buildIncassoCheckoutInvokeBody', () => {
	it('builds complete mode body', () => {
		expect(buildIncassoCheckoutInvokeBody('agr-1', 'complete', 'sess-1')).toEqual({
			lesson_agreement_id: 'agr-1',
			mode: 'complete',
			checkout_session_id: 'sess-1',
		});
	});

	it('builds checkout mode body', () => {
		expect(buildIncassoCheckoutInvokeBody('agr-1', 'checkout', null)).toEqual({
			lesson_agreement_id: 'agr-1',
			mode: 'checkout',
		});
	});
});

describe('extractCheckoutRedirectUrl', () => {
	it('returns checkout url from invoke response', () => {
		expect(extractCheckoutRedirectUrl({ url: 'https://checkout.stripe.com/pay/cs_test' })).toBe(
			'https://checkout.stripe.com/pay/cs_test',
		);
	});

	it('returns null when url is missing', () => {
		expect(extractCheckoutRedirectUrl({})).toBeNull();
	});
});

describe('hasInvokeResponseError', () => {
	it('returns true when invoke error is present', () => {
		expect(hasInvokeResponseError(null, new Error('failed'))).toBe(true);
	});

	it('returns true when response payload contains error', () => {
		expect(hasInvokeResponseError({ error: 'Invalid agreement' }, null)).toBe(true);
	});

	it('returns false when no error is present', () => {
		expect(hasInvokeResponseError({ url: 'https://checkout.stripe.com/pay/cs_test' }, null)).toBe(false);
	});
});

describe('resolveMissingAgreementError', () => {
	it('returns Dutch missing agreement message', () => {
		expect(resolveMissingAgreementError()).toBe('Ongeldige uitnodigingslink (overeenkomst ontbreekt).');
	});
});

describe('runIncassoStartFlow', () => {
	const baseDeps = {
		readMagicLinkUrlError: () => null,
		consumeMagicLinkFromUrl: async () => ({ ok: true }),
		getSession: async () => ({ session: { id: 'session-1' } }),
		invokeCreateSubscriptionCheckout: async () => ({
			data: { url: 'https://checkout.stripe.com/pay/cs_test' },
			error: null,
		}),
		getFunctionErrorMessage: async (_data: unknown, _error: unknown, fallback: string) => fallback,
	};

	it('returns error when agreement id is missing', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams(''), baseDeps);
		expect(result).toEqual({ status: 'error', message: resolveMissingAgreementError() });
	});

	it('returns error when magic link hash contains an error', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), {
			...baseDeps,
			readMagicLinkUrlError: () => 'Hash error',
		});
		expect(result).toEqual({ status: 'error', message: 'Hash error' });
	});

	it('returns error when magic link consumption fails', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), {
			...baseDeps,
			consumeMagicLinkFromUrl: async () => ({ ok: false, error: 'Link expired' }),
		});
		expect(result).toEqual({ status: 'error', message: 'Link expired' });
	});

	it('returns error when session is missing', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), {
			...baseDeps,
			getSession: async () => ({ session: null }),
		});
		expect(result).toEqual({ status: 'error', message: resolveMissingSessionError() });
	});

	it('returns redirect url for checkout mode', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), baseDeps);
		expect(result).toEqual({ status: 'redirect', url: 'https://checkout.stripe.com/pay/cs_test' });
	});

	it('returns success for complete mode', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1&session_id=sess-1'), {
			...baseDeps,
			invokeCreateSubscriptionCheckout: async () => ({ data: { ok: true }, error: null }),
		});
		expect(result).toEqual({ status: 'success' });
	});

	it('returns invoke error message for checkout failures', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), {
			...baseDeps,
			invokeCreateSubscriptionCheckout: async () => ({ data: { error: 'bad request' }, error: null }),
			getFunctionErrorMessage: async () => 'Checkout failed',
		});
		expect(result).toEqual({ status: 'error', message: 'Checkout failed' });
	});

	it('returns complete fallback error for complete mode failures', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1&session_id=sess-1'), {
			...baseDeps,
			invokeCreateSubscriptionCheckout: async () => ({ data: null, error: new Error('failed') }),
			getFunctionErrorMessage: async (_data, _error, fallback) => fallback,
		});
		expect(result).toEqual({ status: 'error', message: resolveIncassoCompleteFallbackError() });
	});

	it('returns missing checkout url error when redirect url is absent', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), {
			...baseDeps,
			invokeCreateSubscriptionCheckout: async () => ({ data: {}, error: null }),
		});
		expect(result).toEqual({ status: 'error', message: resolveMissingCheckoutUrlError() });
	});

	it('returns checkout fallback when invoke fails without custom message', async () => {
		const result = await runIncassoStartFlow(new URLSearchParams('agreement=agr-1'), {
			...baseDeps,
			invokeCreateSubscriptionCheckout: async () => ({ data: null, error: new Error('failed') }),
			getFunctionErrorMessage: async (_data, _error, fallback) => fallback,
		});
		expect(result).toEqual({ status: 'error', message: resolveIncassoCheckoutFallbackError() });
	});
});
