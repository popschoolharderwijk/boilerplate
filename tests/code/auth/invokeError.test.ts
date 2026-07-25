import { describe, expect, it } from 'bun:test';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getInvokeErrorMessage } from '../../../src/lib/auth/invokeError';

const DEFAULT_FALLBACK = 'Er is een onbekende fout opgetreden.';

function makeHttpError(json: () => Promise<unknown>): FunctionsHttpError {
	return new FunctionsHttpError({ json } as Response);
}

describe('getInvokeErrorMessage', () => {
	it('returns the fallback for non-admin users with a generic error', async () => {
		const message = await getInvokeErrorMessage(new Error('Internal stack trace'));
		expect(message).toBe(DEFAULT_FALLBACK);
	});

	it('returns the error message for site admins with a generic error', async () => {
		const message = await getInvokeErrorMessage(new Error('Admin-visible error'), { isSiteAdmin: true });
		expect(message).toBe('Admin-visible error');
	});

	it('uses the edge-function error body for all users', async () => {
		const error = makeHttpError(() => Promise.resolve({ error: 'Factuur bestaat al' }));
		const message = await getInvokeErrorMessage(error);
		expect(message).toBe('Factuur bestaat al');
	});

	it('keeps the admin message when the response body has no error field', async () => {
		const error = makeHttpError(() => Promise.resolve({ message: 'ignored' }));
		const message = await getInvokeErrorMessage(error, { isSiteAdmin: true });
		expect(message).toBe('Edge Function returned a non-2xx status code');
	});

	it('keeps the fallback for non-admin users when the response body has no error field', async () => {
		const error = makeHttpError(() => Promise.resolve({ message: 'ignored' }));
		const message = await getInvokeErrorMessage(error);
		expect(message).toBe(DEFAULT_FALLBACK);
	});

	it('falls back to the admin error message when parsing the response body fails', async () => {
		const error = makeHttpError(() => Promise.reject(new Error('invalid json')));
		const message = await getInvokeErrorMessage(error, { isSiteAdmin: true });
		expect(message).toBe('Edge Function returned a non-2xx status code');
	});

	it('keeps the custom fallback for non-admin users when parsing the response body fails', async () => {
		const error = makeHttpError(() => Promise.reject(new Error('invalid json')));
		const message = await getInvokeErrorMessage(error, { fallback: 'Custom fout' });
		expect(message).toBe('Custom fout');
	});
});
