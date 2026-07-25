import { describe, expect, it } from 'bun:test';
import {
	hasConfirmStepSelectedUser,
	resolveConfirmStepStudentHref,
	resolveConfirmStepTeacherHref,
} from '../../../src/lib/agreements/confirmStepSingleViewHelpers';

describe('hasConfirmStepSelectedUser', () => {
	it('returns true when user is selected', () => {
		expect(hasConfirmStepSelectedUser({ user_id: 'student-1' } as never)).toBe(true);
	});

	it('returns false when user is null', () => {
		expect(hasConfirmStepSelectedUser(null)).toBe(false);
	});
});

describe('resolveConfirmStepStudentHref', () => {
	it('returns student detail href when user id exists', () => {
		expect(resolveConfirmStepStudentHref('student-1')).toBe('/students/student-1');
	});

	it('returns undefined without user id', () => {
		expect(resolveConfirmStepStudentHref(null)).toBeUndefined();
	});
});

describe('resolveConfirmStepTeacherHref', () => {
	it('returns teacher detail href when user id exists', () => {
		expect(resolveConfirmStepTeacherHref('teacher-1')).toBe('/teachers/teacher-1');
	});

	it('returns undefined without user id', () => {
		expect(resolveConfirmStepTeacherHref(undefined)).toBeUndefined();
	});
});
