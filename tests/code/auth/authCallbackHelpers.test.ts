import { describe, expect, it } from 'bun:test';
import {
	isValidAuthCallbackTokenHash,
	parseAuthCallbackHashParams,
	runAuthCallback,
} from '../../../src/lib/auth/authCallbackHelpers';

describe('parseAuthCallbackHashParams', () => {
	it('parses token hash and type from hash fragment', () => {
		expect(parseAuthCallbackHashParams('#token_hash=abc&type=email')).toEqual({
			tokenHash: 'abc',
			type: 'email',
		});
	});

	it('defaults type to email when missing', () => {
		expect(parseAuthCallbackHashParams('#token_hash=abc')).toEqual({
			tokenHash: 'abc',
			type: 'email',
		});
	});
});

describe('isValidAuthCallbackTokenHash', () => {
	it('accepts email token hash params', () => {
		expect(isValidAuthCallbackTokenHash('abc', 'email')).toBe(true);
	});

	it('rejects missing token hash or unsupported type', () => {
		expect(isValidAuthCallbackTokenHash(null, 'email')).toBe(false);
		expect(isValidAuthCallbackTokenHash('abc', 'sms')).toBe(false);
	});
});

describe('runAuthCallback', () => {
	it('returns hash error when present', async () => {
		const outcome = await runAuthCallback({
			readHashError: () => 'hash failed',
			getLocationHref: () => 'https://app.example.com/auth/callback',
			getLocationHash: () => '',
			verifyOtp: async () => ({ error: null }),
			exchangeCodeForSession: async () => ({ error: null }),
		});
		expect(outcome).toEqual({ kind: 'error', message: 'hash failed' });
	});

	it('verifies token hash flow', async () => {
		const outcome = await runAuthCallback({
			readHashError: () => null,
			getLocationHref: () => 'https://app.example.com/auth/callback',
			getLocationHash: () => '#token_hash=abc&type=email',
			verifyOtp: async () => ({ error: null }),
			exchangeCodeForSession: async () => ({ error: null }),
		});
		expect(outcome).toEqual({ kind: 'success' });
	});

	it('returns invalid link for malformed token hash params', async () => {
		const outcome = await runAuthCallback({
			readHashError: () => null,
			getLocationHref: () => 'https://app.example.com/auth/callback',
			getLocationHash: () => '#token_hash=abc&type=sms',
			verifyOtp: async () => ({ error: null }),
			exchangeCodeForSession: async () => ({ error: null }),
		});
		expect(outcome).toEqual({ kind: 'error', message: 'Ongeldige inloglink. Vraag een nieuwe link aan.' });
	});

	it('exchanges code for session when no token hash is present', async () => {
		const outcome = await runAuthCallback({
			readHashError: () => null,
			getLocationHref: () => 'https://app.example.com/auth/callback?code=abc',
			getLocationHash: () => '',
			verifyOtp: async () => ({ error: null }),
			exchangeCodeForSession: async () => ({ error: null }),
		});
		expect(outcome).toEqual({ kind: 'success' });
	});
});
