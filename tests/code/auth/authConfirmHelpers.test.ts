import { describe, expect, it } from 'bun:test';
import { resolveAuthConfirmParams, resolveVerifyOtpErrorMessage } from '../../../src/lib/auth/authConfirmHelpers';

describe('resolveVerifyOtpErrorMessage', () => {
	it('maps expired errors to dutch message', () => {
		expect(resolveVerifyOtpErrorMessage('Token has expired')).toBe(
			'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.',
		);
	});

	it('returns original message for other errors', () => {
		expect(resolveVerifyOtpErrorMessage('Invalid token')).toBe('Invalid token');
	});
});

describe('resolveAuthConfirmParams', () => {
	it('marks params invalid when token hash is missing', () => {
		expect(resolveAuthConfirmParams(new URLSearchParams('type=email'))).toEqual({
			tokenHash: null,
			typeParam: 'email',
			next: '/',
			isValid: false,
		});
	});

	it('parses valid confirm params', () => {
		expect(resolveAuthConfirmParams(new URLSearchParams('token_hash=abc&type=email&next=/students'))).toEqual({
			tokenHash: 'abc',
			typeParam: 'email',
			next: '/students',
			isValid: true,
		});
	});

	it('rejects unsafe next paths', () => {
		expect(resolveAuthConfirmParams(new URLSearchParams('token_hash=abc&type=email&next=//evil.example'))).toEqual({
			tokenHash: 'abc',
			typeParam: 'email',
			next: '/',
			isValid: true,
		});
	});

	it('rejects unsupported otp types', () => {
		expect(resolveAuthConfirmParams(new URLSearchParams('token_hash=abc&type=sms'))).toEqual({
			tokenHash: 'abc',
			typeParam: 'sms',
			next: '/',
			isValid: false,
		});
	});
});
