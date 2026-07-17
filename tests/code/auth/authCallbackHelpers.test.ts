import { describe, expect, it } from 'bun:test';
import { runAuthCallback } from '../../../src/lib/auth/authCallbackHelpers';

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

	it('returns verify error when otp verification fails', async () => {
		const outcome = await runAuthCallback({
			readHashError: () => null,
			getLocationHref: () => 'https://app.example.com/auth/callback',
			getLocationHash: () => '#token_hash=abc&type=email',
			verifyOtp: async () => ({ error: { message: 'Invalid token' } }),
			exchangeCodeForSession: async () => ({ error: null }),
		});
		expect(outcome).toEqual({ kind: 'error', message: 'Invalid token' });
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

	it('returns exchange error when code exchange fails', async () => {
		const outcome = await runAuthCallback({
			readHashError: () => null,
			getLocationHref: () => 'https://app.example.com/auth/callback?code=abc',
			getLocationHash: () => '',
			verifyOtp: async () => ({ error: null }),
			exchangeCodeForSession: async () => ({ error: { message: 'Code expired' } }),
		});
		expect(outcome).toEqual({ kind: 'error', message: 'Code expired' });
	});
});
