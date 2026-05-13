/**
 * RLS tests for trial_lessons INSERT/UPDATE/DELETE policies.
 * Only is_privileged() (staff/admin/site_admin) may write.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createClientAs, createClientBypassRLS } from '../../db';
import type { TrialLessonInsert } from '../../types';
import { expectInsufficientPrivilege, unwrap, unwrapError } from '../../utils';
import { type DatabaseState, setupDatabaseStateVerification } from '../db-state';
import { fixtures } from '../fixtures';
import { TestUsers } from '../test-users';

let initialState: DatabaseState;
const { setupState, verifyState } = setupDatabaseStateVerification();

const dbNoRLS = createClientBypassRLS();
const lessonTypeId = fixtures.requireLessonTypeId('Gitaarles');

const studentUserId = fixtures.requireUserId(TestUsers.STUDENT_009);
const teacherUserId = fixtures.requireUserId(TestUsers.TEACHER_ALICE);

function makeInsert(): TrialLessonInsert {
	return {
		student_user_id: studentUserId,
		teacher_user_id: teacherUserId,
		lesson_type_id: lessonTypeId,
		scheduled_date: '2030-02-15',
		scheduled_start_time: '15:00:00',
		duration_minutes: 30,
		status: 'scheduled',
	};
}

const seededIds: string[] = [];

beforeAll(async () => {
	initialState = await setupState();
});

afterAll(async () => {
	if (seededIds.length > 0) {
		unwrap(await dbNoRLS.from('trial_lessons').delete().in('id', seededIds));
	}
	await verifyState(initialState);
});

describe('trial_lessons INSERT RLS', () => {
	it('staff can insert', async () => {
		const db = await createClientAs(TestUsers.STAFF_ONE);
		const [row] = unwrap(await db.from('trial_lessons').insert(makeInsert()).select('id'));
		seededIds.push(row.id);
		expect(row.id).toBeTruthy();
	});

	it('teacher cannot insert', async () => {
		const db = await createClientAs(TestUsers.TEACHER_ALICE);
		const err = unwrapError(await db.from('trial_lessons').insert(makeInsert()).select('id'));
		expectInsufficientPrivilege(err);
	});

	it('student cannot insert', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const err = unwrapError(await db.from('trial_lessons').insert(makeInsert()).select('id'));
		expectInsufficientPrivilege(err);
	});
});

describe('trial_lessons UPDATE/DELETE RLS', () => {
	it('teacher cannot update their own assigned trial', async () => {
		const [created] = unwrap(await dbNoRLS.from('trial_lessons').insert(makeInsert()).select('id'));
		seededIds.push(created.id);
		const db = await createClientAs(TestUsers.TEACHER_ALICE);
		const { error } = await db.from('trial_lessons').update({ notes: 'x' }).eq('id', created.id).select('id');
		// Update returning no rows is allowed silently; check that data is unchanged via service role
		const { data: after } = await dbNoRLS.from('trial_lessons').select('notes').eq('id', created.id).single();
		expect(after?.notes ?? null).toBeNull();
		expect(error).toBeNull();
	});

	it('student cannot delete their own trial', async () => {
		const [created] = unwrap(await dbNoRLS.from('trial_lessons').insert(makeInsert()).select('id'));
		seededIds.push(created.id);
		const db = await createClientAs(TestUsers.STUDENT_009);
		await db.from('trial_lessons').delete().eq('id', created.id);
		const { data: still } = await dbNoRLS.from('trial_lessons').select('id').eq('id', created.id).maybeSingle();
		expect(still?.id).toBe(created.id);
	});

	it('admin can update', async () => {
		const [created] = unwrap(await dbNoRLS.from('trial_lessons').insert(makeInsert()).select('id'));
		seededIds.push(created.id);
		const db = await createClientAs(TestUsers.ADMIN_ONE);
		unwrap(await db.from('trial_lessons').update({ notes: 'updated' }).eq('id', created.id).select('id'));
		const { data: after } = await dbNoRLS.from('trial_lessons').select('notes').eq('id', created.id).single();
		expect(after?.notes).toBe('updated');
	});
});
