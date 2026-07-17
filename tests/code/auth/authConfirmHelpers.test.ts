import { describe, expect, it } from 'bun:test';
import {
	getSafeNext,
	isValidEmailOtpType,
	resolveAuthConfirmParams,
	resolveVerifyOtpErrorMessage,
} from '../../../src/lib/auth/authConfirmHelpers';

describe('getSafeNext', () => {
	it('returns slash for missing or unsafe values', () => {
		expect(getSafeNext(null)).toBe('/');
		expect(getSafeNext('//evil.example')).toBe('/');
		expect(getSafeNext('https://evil.example')).toBe('/');
	});

	it('returns safe relative paths', () => {
		expect(getSafeNext('/dashboard')).toBe('/dashboard');
	});
});

describe('isValidEmailOtpType', () => {
	it('accepts supported otp types', () => {
		expect(isValidEmailOtpType('email')).toBe(true);
		expect(isValidEmailOtpType('recovery')).toBe(true);
	});

	it('rejects unsupported otp types', () => {
		expect(isValidEmailOtpType('sms')).toBe(false);
	});
});

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
});
