import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { emptyStudentForm } from '../../../src/components/students/studentFormTypes';

let createUserResult: { data: { user: { id: string } | null }; error: { message: string } | null } = {
	data: { user: { id: 'user-1' } },
	error: null,
};
let insertResult: { data: { user_id: string } | null; error: { message: string } | null } = {
	data: { user_id: 'user-1' },
	error: null,
};

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		auth: {
			admin: {
				createUser: async () => createUserResult,
			},
		},
		from: () => ({
			insert: () => ({
				select: () => ({
					single: async () => insertResult,
				}),
			}),
		}),
	},
}));

const { createStudentRecord } = await import('../../../src/components/students/studentFormPersistence');

describe('createStudentRecord', () => {
	beforeEach(() => {
		createUserResult = {
			data: { user: { id: 'user-1' } },
			error: null,
		};
		insertResult = {
			data: { user_id: 'user-1' },
			error: null,
		};
	});

	it('creates student for new-user mode', async () => {
		expect(await createStudentRecord(emptyStudentForm, 'new-user', null)).toEqual({ ok: true });
	});

	it('uses selected user id for existing-user mode', async () => {
		expect(await createStudentRecord(emptyStudentForm, 'existing-user', 'existing-user-1')).toEqual({ ok: true });
	});

	it('returns auth error when user creation fails', async () => {
		createUserResult = {
			data: { user: null },
			error: { message: 'auth failed' },
		};
		expect(await createStudentRecord(emptyStudentForm, 'new-user', null)).toEqual({
			ok: false,
			title: 'Fout bij aanmaken gebruiker',
			description: 'auth failed',
		});
	});

	it('returns insert error when student creation fails', async () => {
		insertResult = {
			data: null,
			error: { message: 'insert failed' },
		};
		expect(await createStudentRecord(emptyStudentForm, 'new-user', null)).toEqual({
			ok: false,
			title: 'Fout bij aanmaken leerling',
			description: 'insert failed',
		});
	});
});
