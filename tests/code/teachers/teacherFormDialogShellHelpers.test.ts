import { describe, expect, it } from 'bun:test';
import { EMPTY_TEACHER_FORM } from '../../../src/lib/teachers/teacherFormDialogHelpers';
import {
	resolveTeacherFormDialogCopy,
	resolveTeacherFormSubmitDisabled,
	resolveTeacherFormSubmitLabel,
} from '../../../src/lib/teachers/teacherFormDialogShellHelpers';

describe('resolveTeacherFormDialogCopy', () => {
	it('returns create copy for new teachers', () => {
		expect(resolveTeacherFormDialogCopy(false, EMPTY_TEACHER_FORM).title).toBe('Nieuwe docent toevoegen');
	});

	it('returns edit copy with teacher name', () => {
		expect(
			resolveTeacherFormDialogCopy(true, { ...EMPTY_TEACHER_FORM, first_name: 'Alice', email: 'alice@test.nl' })
				.description,
		).toBe('Wijzig de gegevens van Alice.');
	});
});

describe('resolveTeacherFormSubmitDisabled', () => {
	it('disables create submit without selected user', () => {
		expect(resolveTeacherFormSubmitDisabled(false, EMPTY_TEACHER_FORM, null)).toBe(true);
	});

	it('enables create submit with selected user', () => {
		expect(resolveTeacherFormSubmitDisabled(false, EMPTY_TEACHER_FORM, 'user-1')).toBe(false);
	});

	it('disables edit submit without email', () => {
		expect(resolveTeacherFormSubmitDisabled(true, EMPTY_TEACHER_FORM, null)).toBe(true);
	});
});

describe('resolveTeacherFormSubmitLabel', () => {
	it('returns create labels', () => {
		expect(resolveTeacherFormSubmitLabel(false)).toEqual({ idle: 'Toevoegen', loading: 'Toevoegen...' });
	});

	it('returns edit labels', () => {
		expect(resolveTeacherFormSubmitLabel(true)).toEqual({ idle: 'Opslaan', loading: 'Opslaan...' });
	});
});
