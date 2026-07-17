import { describe, expect, it } from 'bun:test';
import { planAuthSessionApply, runAuthSessionSideEffects } from '../../../src/lib/auth/authSessionHelpers';

describe('planAuthSessionApply', () => {
	it('plans role fetch when session has a user', () => {
		expect(planAuthSessionApply({ user: { id: 'user-1' } } as never, false)).toEqual({
			userId: 'user-1',
			shouldFetchRoleAndTeacher: true,
			shouldClearRoleOnLogout: false,
		});
	});

	it('clears role on logout when session is missing', () => {
		expect(planAuthSessionApply(null, true)).toEqual({
			userId: null,
			shouldFetchRoleAndTeacher: false,
			shouldClearRoleOnLogout: true,
		});
	});

	it('does not clear role when initial session is missing', () => {
		expect(planAuthSessionApply(null, false)).toEqual({
			userId: null,
			shouldFetchRoleAndTeacher: false,
			shouldClearRoleOnLogout: false,
		});
	});
});

describe('runAuthSessionSideEffects', () => {
	it('fetches role and teacher when session has a user', async () => {
		let completed = false;
		const calls: string[] = [];
		runAuthSessionSideEffects({
			plan: {
				userId: 'user-1',
				shouldFetchRoleAndTeacher: true,
				shouldClearRoleOnLogout: false,
			},
			fetchRole: async (userId) => {
				calls.push(`role:${userId}`);
			},
			fetchTeacher: async (userId) => {
				calls.push(`teacher:${userId}`);
			},
			clearRoleState: () => {
				calls.push('clear');
			},
			onLoadingComplete: () => {
				completed = true;
			},
		});
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});
		expect(calls).toEqual(['role:user-1', 'teacher:user-1']);
		expect(completed).toBe(true);
	});

	it('clears role state on logout', () => {
		let cleared = false;
		let completed = false;
		runAuthSessionSideEffects({
			plan: {
				userId: null,
				shouldFetchRoleAndTeacher: false,
				shouldClearRoleOnLogout: true,
			},
			fetchRole: async () => {},
			fetchTeacher: async () => {},
			clearRoleState: () => {
				cleared = true;
			},
			onLoadingComplete: () => {
				completed = true;
			},
		});
		expect(cleared).toBe(true);
		expect(completed).toBe(true);
	});
});
