import { describe, expect, it } from 'bun:test';
import { EMPTY_TEACHER_FORM } from '../../../src/lib/teachers/teacherFormDialogHelpers';
import { executeTeacherFormDialogSubmit } from '../../../src/lib/teachers/teacherFormDialogSubmit';

describe('executeTeacherFormDialogSubmit', () => {
	it('returns validation-failed in create mode without selected user', async () => {
		const outcome = await executeTeacherFormDialogSubmit({
			isEditMode: false,
			teacher: undefined,
			selectedUserId: null,
			form: EMPTY_TEACHER_FORM,
		});
		expect(outcome.kind).toBe('validation-failed');
	});
});
