import { describe, expect, it } from 'bun:test';
import { validateSyncBody } from '../../../supabase/functions/sync-stripe-subscription/validation';

async function readError(response: Response): Promise<string> {
	const body = (await response.json()) as { error: string };
	return body.error;
}

describe('validateSyncBody', () => {
	it('returns null when stripe subscription id is provided', () => {
		expect(validateSyncBody({ stripe_subscription_id: 'sub_123' })).toBeNull();
	});

	it('returns null when lesson agreement id is provided', () => {
		expect(validateSyncBody({ lesson_agreement_id: '11111111-1111-1111-1111-111111111111' })).toBeNull();
	});

	it('rejects a body without identifiers', async () => {
		const response = validateSyncBody({});
		expect(response?.status).toBe(400);
		expect(await readError(response as Response)).toBe('Geef stripe_subscription_id of lesson_agreement_id mee');
	});
});
