import { describe, expect, it } from 'bun:test';
import type { AuthError } from '@supabase/supabase-js';
import { resolveLoginOtpVerifyOutcome, resolveLoginStateAfterOtpVerify } from '../../../src/lib/auth/loginOtpHelpers';

describe('resolveLoginOtpVerifyOutcome', () => {
	it('returns success when there is no error', () => {
		expect(resolveLoginOtpVerifyOutcome(null)).toEqual({ kind: 'success' });
	});

	it('returns error message when verification fails', () => {
		expect(resolveLoginOtpVerifyOutcome({ message: 'Invalid code', name: 'AuthApiError' } as AuthError)).toEqual({
			kind: 'error',
			message: 'Invalid code',
		});
	});
});

describe('resolveLoginStateAfterOtpVerify', () => {
	it('returns sent after a failed verification', () => {
		expect(resolveLoginStateAfterOtpVerify({ kind: 'error', message: 'Invalid code' })).toBe('sent');
	});

	it('returns verifying after a successful verification', () => {
		expect(resolveLoginStateAfterOtpVerify({ kind: 'success' })).toBe('verifying');
	});
});
