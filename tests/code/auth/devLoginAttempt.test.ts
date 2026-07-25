import { describe, expect, it, mock } from 'bun:test';

mock.module('@/integrations/supabase/client', () => ({
	supabase: {
		auth: {
			signInWithPassword: mock(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
		},
	},
}));

import { runDevLoginAttempt } from '../../../src/lib/auth/devLoginAttempt';

describe('runDevLoginAttempt', () => {
	it('returns error when email cannot be resolved', async () => {
		const result = await runDevLoginAttempt('unknown-value');
		expect(result.ok).toBe(false);
		if (result.ok === false) {
			expect(result.error).toBe('Selecteer eerst een rol, docent, leerling of user');
		}
	});

	it('returns success for valid dev teacher email', async () => {
		const previous = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
		import.meta.env.VITE_DEV_LOGIN_PASSWORD = 'secret';
		const result = await runDevLoginAttempt('teacher-alice@test.nl');
		import.meta.env.VITE_DEV_LOGIN_PASSWORD = previous;
		expect(result.ok).toBe(true);
	});
});
