import { describe, expect, it } from 'bun:test';
import { emptyStudentForm } from '../../../src/components/students/studentFormTypes';

describe('executeStudentFormSubmit', () => {
	it('returns validation-error for invalid new student form', async () => {
		const { executeStudentFormSubmit } = await import('../../../src/components/students/studentFormSubmitHelpers');
		const outcome = await executeStudentFormSubmit({
			form: emptyStudentForm,
			isEditMode: false,
			mode: 'new-user',
			selectedUserId: null,
		});
		expect(outcome).toBe('validation-error');
	});
});
