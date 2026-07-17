import { describe, expect, it } from 'bun:test';
import { validateApproveBody } from '../../../supabase/functions/approve-signup-request/validation';

const REQUEST_ID = '11111111-1111-1111-1111-111111111111';
const GROUP_ID = '22222222-2222-2222-2222-222222222222';

async function readError(response: Response): Promise<string> {
	const body = (await response.json()) as { error: string };
	return body.error;
}

describe('validateApproveBody', () => {
	it('returns null for a valid approve body', () => {
		expect(validateApproveBody({ request_id: REQUEST_ID })).toBeNull();
		expect(validateApproveBody({ request_id: REQUEST_ID, override_lesson_group_id: GROUP_ID })).toBeNull();
	});

	it('rejects invalid request and group ids', async () => {
		expect(await readError(validateApproveBody({ request_id: 'bad' }) as Response)).toBe('Ongeldig request id');
		expect(
			await readError(
				validateApproveBody({ request_id: REQUEST_ID, override_lesson_group_id: 'bad' }) as Response,
			),
		).toBe('Ongeldig groep id');
	});
});
