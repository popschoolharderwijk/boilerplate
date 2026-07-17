import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { resolveLegacyPersonUserId } from '../../../supabase/functions/_shared/legacyImportHelpers';

type UpsertCall = { table: string; payload: unknown; options?: unknown };

const recordedUpserts: UpsertCall[] = [];
let profilesError: { message: string } | null = null;
let rolesError: { message: string } | null = null;

function createAdminMock() {
	return {
		from: (table: string) => ({
			upsert: (payload: unknown, options?: unknown) => {
				recordedUpserts.push({ table, payload, options });
				const error = table === 'profiles' ? profilesError : table === 'user_roles' ? rolesError : null;
				return Promise.resolve({ error });
			},
		}),
	};
}

describe('resolveLegacyPersonUserId', () => {
	let resolveFn: typeof resolveLegacyPersonUserId;

	beforeAll(async () => {
		resolveFn = resolveLegacyPersonUserId;
	});

	beforeEach(() => {
		recordedUpserts.length = 0;
		profilesError = null;
		rolesError = null;
	});

	it('reuses mapped user id and marks created as false', async () => {
		const ensureAuthUser = async () => 'should-not-be-called';
		const result = await resolveFn({
			admin: createAdminMock() as never,
			personMap: new Map([['legacy-1', 'user-existing']]),
			legacyId: 'legacy-1',
			email: 'anna@example.com',
			firstName: 'Anna',
			lastName: 'Bakker',
			phone: '0612345678',
			role: 'student',
			ensureAuthUser,
		});
		expect(result).toEqual({ userId: 'user-existing', created: false });
		expect(recordedUpserts).toEqual([
			{
				table: 'profiles',
				payload: {
					user_id: 'user-existing',
					email: 'anna@example.com',
					first_name: 'Anna',
					last_name: 'Bakker',
					phone_number: '0612345678',
				},
				options: { onConflict: 'user_id' },
			},
			{
				table: 'user_roles',
				payload: { user_id: 'user-existing', role: 'student' },
				options: { onConflict: 'user_id,role' },
			},
		]);
	});

	it('creates auth user when legacy person is not mapped yet', async () => {
		const ensureAuthUser = async () => 'user-new';
		const result = await resolveFn({
			admin: createAdminMock() as never,
			personMap: new Map(),
			legacyId: 'legacy-2',
			email: 'piet@example.com',
			firstName: 'Piet',
			lastName: 'Docent',
			phone: null,
			role: 'teacher',
			ensureAuthUser,
		});
		expect(result).toEqual({ userId: 'user-new', created: true });
		expect(recordedUpserts[0]?.table).toBe('profiles');
		expect(recordedUpserts[1]).toEqual({
			table: 'user_roles',
			payload: { user_id: 'user-new', role: 'teacher' },
			options: { onConflict: 'user_id,role' },
		});
	});

	it('normalizes undefined profile fields to null', async () => {
		const ensureAuthUser = async () => 'user-new';
		await resolveFn({
			admin: createAdminMock() as never,
			personMap: new Map(),
			legacyId: 'legacy-3',
			email: 'bob@example.com',
			firstName: undefined,
			lastName: undefined,
			phone: undefined,
			role: 'student',
			ensureAuthUser,
		});
		expect(recordedUpserts[0]?.payload).toEqual({
			user_id: 'user-new',
			email: 'bob@example.com',
			first_name: null,
			last_name: null,
			phone_number: null,
		});
	});
});
