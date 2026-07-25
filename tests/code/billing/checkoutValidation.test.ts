import { describe, expect, it } from 'bun:test';
import {
	resolveCheckoutMode,
	validateCheckoutBody,
} from '../../../supabase/functions/create-subscription-checkout/validation';

const AGREEMENT_ID = '11111111-1111-1111-1111-111111111111';

async function readError(response: Response): Promise<string> {
	const body = (await response.json()) as { error: string };
	return body.error;
}

describe('validateCheckoutBody', () => {
	it('returns null for a valid lesson agreement id', () => {
		expect(validateCheckoutBody({ lesson_agreement_id: AGREEMENT_ID })).toBeNull();
	});

	it('rejects a missing or invalid lesson agreement id', async () => {
		expect(await readError(validateCheckoutBody({ lesson_agreement_id: '' }) as Response)).toBe(
			'Ongeldig lesson_agreement_id',
		);
		expect(await readError(validateCheckoutBody({ lesson_agreement_id: 'bad' }) as Response)).toBe(
			'Ongeldig lesson_agreement_id',
		);
	});
});

describe('resolveCheckoutMode', () => {
	it('returns direct or complete when explicitly set', () => {
		expect(resolveCheckoutMode({ lesson_agreement_id: AGREEMENT_ID, mode: 'direct' })).toBe('direct');
		expect(resolveCheckoutMode({ lesson_agreement_id: AGREEMENT_ID, mode: 'complete' })).toBe('complete');
	});

	it('defaults to checkout for other or missing modes', () => {
		expect(resolveCheckoutMode({ lesson_agreement_id: AGREEMENT_ID })).toBe('checkout');
		expect(resolveCheckoutMode({ lesson_agreement_id: AGREEMENT_ID, mode: 'checkout' })).toBe('checkout');
	});
});
