import { describe, expect, it } from 'bun:test';
import {
	buildStudentProfileUpdateFields,
	needsProfileUpdateAfterCreate,
	resolveAuthUserCreateResult,
	resolveCreateStudentUserIdAfterAuth,
	resolveCreateStudentUserIdFromSelection,
	resolveStudentInsertResult,
} from '../../../src/components/students/studentFormPersistenceHelpers';
import { emptyStudentForm } from '../../../src/components/students/studentFormTypes';

describe('resolveCreateStudentUserIdFromSelection', () => {
	it('returns selected user id for existing-user mode', () => {
		expect(resolveCreateStudentUserIdFromSelection('existing-user', 'user-1')).toEqual({
			ok: true,
			userId: 'user-1',
		});
	});

	it('returns success without user id for new-user mode', () => {
		expect(resolveCreateStudentUserIdFromSelection('new-user', null)).toEqual({ ok: true });
	});

	it('returns success without user id when existing-user mode has no selection', () => {
		expect(resolveCreateStudentUserIdFromSelection('existing-user', null)).toEqual({ ok: true });
	});
});

describe('buildStudentProfileUpdateFields', () => {
	it('maps empty strings to null', () => {
		expect(buildStudentProfileUpdateFields({ ...emptyStudentForm, last_name: 'Bakker' })).toEqual({
			first_name: null,
			last_name: 'Bakker',
			phone_number: null,
		});
	});
});

describe('needsProfileUpdateAfterCreate', () => {
	it('returns true when profile fields are present', () => {
		expect(needsProfileUpdateAfterCreate({ ...emptyStudentForm, first_name: 'Anna' })).toBe(true);
	});

	it('returns false when profile fields are empty', () => {
		expect(needsProfileUpdateAfterCreate(emptyStudentForm)).toBe(false);
	});
});

describe('resolveCreateStudentUserIdAfterAuth', () => {
	it('returns auth failure without user id', () => {
		expect(
			resolveCreateStudentUserIdAfterAuth(emptyStudentForm, { ok: false, title: 'Auth failed' }, { ok: true }),
		).toEqual({ ok: false, title: 'Auth failed' });
	});

	it('returns user id when profile update is not needed', () => {
		expect(
			resolveCreateStudentUserIdAfterAuth(emptyStudentForm, { ok: true, userId: 'user-1' }, { ok: true }),
		).toEqual({ ok: true, userId: 'user-1' });
	});

	it('returns profile update failure when profile update fails', () => {
		expect(
			resolveCreateStudentUserIdAfterAuth(
				{ ...emptyStudentForm, first_name: 'Anna' },
				{ ok: true, userId: 'user-1' },
				{ ok: false, title: 'Profile failed' },
			),
		).toEqual({ ok: false, title: 'Profile failed' });
	});

	it('returns user id when profile update succeeds', () => {
		expect(
			resolveCreateStudentUserIdAfterAuth(
				{ ...emptyStudentForm, first_name: 'Anna' },
				{ ok: true, userId: 'user-1' },
				{ ok: true },
			),
		).toEqual({ ok: true, userId: 'user-1' });
	});
});

describe('resolveAuthUserCreateResult', () => {
	it('returns auth failure when user is missing', () => {
		expect(resolveAuthUserCreateResult({ message: 'duplicate' }, null)).toEqual({
			ok: false,
			title: 'Fout bij aanmaken gebruiker',
			description: 'duplicate',
		});
	});

	it('returns user id on success', () => {
		expect(resolveAuthUserCreateResult(null, { id: 'user-1' })).toEqual({
			ok: true,
			userId: 'user-1',
		});
	});
});

describe('resolveStudentInsertResult', () => {
	it('returns insert failure when student data is missing', () => {
		expect(resolveStudentInsertResult(null, { message: 'insert failed' })).toEqual({
			ok: false,
			title: 'Fout bij aanmaken leerling',
			description: 'insert failed',
		});
	});

	it('returns success when student is created', () => {
		expect(resolveStudentInsertResult({ user_id: 'user-1' }, null)).toEqual({ ok: true });
	});
});
