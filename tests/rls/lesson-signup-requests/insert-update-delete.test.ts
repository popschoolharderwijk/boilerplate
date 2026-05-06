import { afterAll, beforeAll, describe, it } from 'bun:test';
import { createClientAs } from '../../db';
import type { LessonSignupRequestInsert } from '../../types';
import { expectInsufficientPrivilege, unwrap, unwrapError } from '../../utils';
import { type DatabaseState, setupDatabaseStateVerification } from '../db-state';
import { fixtures } from '../fixtures';
import { type TestUser, TestUsers } from '../test-users';

let initialState: DatabaseState;
const { setupState, verifyState } = setupDatabaseStateVerification();

const lessonTypeId = fixtures.requireLessonTypeId('Gitaarles');

beforeAll(async () => {
	initialState = await setupState();
});

afterAll(async () => {
	await verifyState(initialState);
});

/**
 * lesson_signup_requests INSERT/UPDATE/DELETE:
 *   INSERT: any role (incl. anon) iff status='pending' and processing fields null
 *   UPDATE: privileged only (staff/admin/site_admin)
 *   DELETE: privileged only (staff/admin/site_admin)
 */

function newPendingRequest(): LessonSignupRequestInsert {
	return {
		first_name: 'CRUD',
		last_name: 'Test',
		email: `crud-${Date.now()}-${Math.random().toString(36).slice(2)}@popschoolharderwijk.nl`,
		lesson_type_id: lessonTypeId,
		status: 'pending',
	};
}

async function insertAs(user: TestUser) {
	const db = await createClientAs(user);
	const [row] = unwrap(await db.from('lesson_signup_requests').insert(newPendingRequest()).select('id'));
	return {
		id: row.id,
		cleanup: async () => {
			const admin = await createClientAs(TestUsers.SITE_ADMIN);
			unwrap(await admin.from('lesson_signup_requests').delete().eq('id', row.id));
		},
	};
}

describe('RLS: lesson_signup_requests INSERT - allowed for any authenticated user when pending', () => {
	for (const user of [
		TestUsers.STUDENT_009,
		TestUsers.TEACHER_ALICE,
		TestUsers.STAFF_ONE,
		TestUsers.ADMIN_ONE,
		TestUsers.SITE_ADMIN,
		TestUsers.USER_001,
	]) {
		it(`${user} can insert a pending request`, async () => {
			const { cleanup } = await insertAs(user);
			await cleanup();
		});
	}

	it('non-pending status is rejected for non-privileged users', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const payload: LessonSignupRequestInsert = { ...newPendingRequest(), status: 'approved' };
		expectInsufficientPrivilege(unwrapError(await db.from('lesson_signup_requests').insert(payload).select()));
	});
});

describe('RLS: lesson_signup_requests UPDATE/DELETE - blocked for non-privileged roles', () => {
	async function blockedUpdate(user: TestUser) {
		const { id, cleanup } = await insertAs(TestUsers.SITE_ADMIN);
		try {
			const db = await createClientAs(user);
			const data = unwrap(
				await db.from('lesson_signup_requests').update({ first_name: 'Hacker' }).eq('id', id).select(),
			);
			// RLS silently filters: zero rows affected.
			if (data.length !== 0) {
				throw new Error(`Expected UPDATE to be RLS-filtered for ${user}, got ${data.length} rows`);
			}
		} finally {
			await cleanup();
		}
	}

	async function blockedDelete(user: TestUser) {
		const { id, cleanup } = await insertAs(TestUsers.SITE_ADMIN);
		try {
			const db = await createClientAs(user);
			const data = unwrap(await db.from('lesson_signup_requests').delete().eq('id', id).select());
			if (data.length !== 0) {
				throw new Error(`Expected DELETE to be RLS-filtered for ${user}, got ${data.length} rows`);
			}
		} finally {
			await cleanup();
		}
	}

	for (const user of [TestUsers.STUDENT_009, TestUsers.TEACHER_ALICE, TestUsers.USER_001]) {
		it(`${user} cannot UPDATE`, () => blockedUpdate(user));
		it(`${user} cannot DELETE`, () => blockedDelete(user));
	}
});

describe('RLS: lesson_signup_requests UPDATE/DELETE - allowed for privileged roles', () => {
	for (const user of [TestUsers.STAFF_ONE, TestUsers.ADMIN_ONE, TestUsers.SITE_ADMIN]) {
		it(`${user} can UPDATE and DELETE`, async () => {
			const { id } = await insertAs(TestUsers.SITE_ADMIN);
			const db = await createClientAs(user);
			unwrap(await db.from('lesson_signup_requests').update({ first_name: 'Updated' }).eq('id', id).select());
			unwrap(await db.from('lesson_signup_requests').delete().eq('id', id));
		});
	}
});
