import { describe, expect, it } from 'bun:test';
import { validateTeacherFormSubmit } from '../../../src/lib/teachers/teacherFormDialogSubmit';

describe('validateTeacherFormSubmit', () => {
	it('returns true in edit mode', () => {
		expect(validateTeacherFormSubmit(true, null)).toBe(true);
	});

	it('returns true in create mode with selected user', () => {
		expect(validateTeacherFormSubmit(false, 'user-1')).toBe(true);
	});

	it('returns false in create mode without selected user', () => {
		expect(validateTeacherFormSubmit(false, null)).toBe(false);
	});
});
