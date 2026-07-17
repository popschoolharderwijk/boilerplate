import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as teacherFormDialogActions from '../../../src/lib/teachers/teacherFormDialogActions';
import { EMPTY_TEACHER_FORM } from '../../../src/lib/teachers/teacherFormDialogHelpers';
import type { Teacher } from '../../../src/types/teachers';

const toastCalls: { kind: 'error' | 'success' | 'warning'; message: string; description?: string }[] = [];

mock.module('sonner', () => ({
	toast: {
		error: (message: string, options?: { description?: string }) => {
			toastCalls.push({ kind: 'error', message, description: options?.description });
		},
		success: (message: string) => {
			toastCalls.push({ kind: 'success', message });
		},
		warning: (message: string, options?: { description?: string }) => {
			toastCalls.push({ kind: 'warning', message, description: options?.description });
		},
	},
}));

function createTeacher(): Teacher {
	return {
		user_id: 'teacher-1',
		bio: 'Existing bio',
		email: 'teacher@example.com',
		first_name: 'Piet',
		last_name: 'Docent',
		phone_number: '0612345678',
	} as Teacher;
}

describe('executeTeacherFormDialogSubmit', () => {
	let executeTeacherFormDialogSubmit: typeof import('../../../src/lib/teachers/teacherFormDialogSubmit').executeTeacherFormDialogSubmit;
	let updateTeacherBioSpy: ReturnType<typeof spyOn>;
	let updateTeacherProfileFieldsSpy: ReturnType<typeof spyOn>;
	let syncTeacherLessonTypesSpy: ReturnType<typeof spyOn>;

	beforeAll(async () => {
		({ executeTeacherFormDialogSubmit } = await import('../../../src/lib/teachers/teacherFormDialogSubmit'));
	});

	beforeEach(() => {
		toastCalls.length = 0;
		updateTeacherBioSpy = spyOn(teacherFormDialogActions, 'updateTeacherBio').mockResolvedValue(null);
		updateTeacherProfileFieldsSpy = spyOn(teacherFormDialogActions, 'updateTeacherProfileFields').mockResolvedValue(
			null,
		);
		syncTeacherLessonTypesSpy = spyOn(teacherFormDialogActions, 'syncTeacherLessonTypes').mockResolvedValue({
			addError: null,
			removeError: null,
		});
	});

	afterEach(() => {
		updateTeacherBioSpy.mockRestore();
		updateTeacherProfileFieldsSpy.mockRestore();
		syncTeacherLessonTypesSpy.mockRestore();
	});

	it('returns validation-failed in create mode without selected user', async () => {
		const outcome = await executeTeacherFormDialogSubmit({
			isEditMode: false,
			teacher: undefined,
			selectedUserId: null,
			form: EMPTY_TEACHER_FORM,
		});
		expect(outcome).toEqual({ kind: 'validation-failed' });
		expect(toastCalls).toEqual([
			{ kind: 'error', message: 'Selecteer een bestaande gebruiker of maak een nieuwe aan' },
		]);
	});

	it('returns edit-success when edit mode updates succeed', async () => {
		const outcome = await executeTeacherFormDialogSubmit({
			isEditMode: true,
			teacher: createTeacher(),
			selectedUserId: null,
			form: {
				...EMPTY_TEACHER_FORM,
				first_name: 'Piet',
				last_name: 'Docent',
				bio: 'Updated bio',
				lesson_type_ids: ['lt-1'],
			},
		});

		expect(outcome).toEqual({ kind: 'edit-success' });
		expect(updateTeacherBioSpy).toHaveBeenCalledTimes(1);
		expect(updateTeacherProfileFieldsSpy).toHaveBeenCalledTimes(1);
		expect(syncTeacherLessonTypesSpy).toHaveBeenCalledTimes(1);
		expect(toastCalls).toEqual([{ kind: 'success', message: 'Docent bijgewerkt' }]);
	});

	it('returns action-failed when bio update fails in edit mode', async () => {
		updateTeacherBioSpy.mockResolvedValue('bio failed');

		const outcome = await executeTeacherFormDialogSubmit({
			isEditMode: true,
			teacher: createTeacher(),
			selectedUserId: null,
			form: { ...EMPTY_TEACHER_FORM, bio: 'Updated bio' },
		});

		expect(outcome).toEqual({ kind: 'action-failed' });
		expect(updateTeacherProfileFieldsSpy).toHaveBeenCalledTimes(0);
		expect(toastCalls).toEqual([
			{ kind: 'error', message: 'Fout bij bijwerken docent', description: 'bio failed' },
		]);
	});
});
