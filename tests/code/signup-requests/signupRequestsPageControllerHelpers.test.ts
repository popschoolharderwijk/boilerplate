import { describe, expect, it } from 'bun:test';
import { resolveApproveSignupError } from '../../../src/lib/signup-requests/signupRequestsPageControllerHelpers';

describe('resolveApproveSignupError', () => {
	it('returns invoke error message when invoke fails', () => {
		expect(resolveApproveSignupError({ message: 'Network error' }, null)).toBe('Network error');
	});

	it('returns response error when invoke succeeds with error payload', () => {
		expect(resolveApproveSignupError(null, { error: 'Invalid request' })).toBe('Invalid request');
	});

	it('returns null when approve succeeds', () => {
		expect(resolveApproveSignupError(null, { student_user_id: 'user-1' })).toBeNull();
	});
});
