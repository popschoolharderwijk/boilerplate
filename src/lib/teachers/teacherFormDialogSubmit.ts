import { toast } from 'sonner';
import {
	createTeacherRecord,
	linkTeacherLessonTypes,
	syncTeacherLessonTypes,
	updateTeacherBio,
	updateTeacherProfileFields,
} from '@/lib/teachers/teacherFormDialogActions';
import type { TeacherFormState } from '@/lib/teachers/teacherFormDialogHelpers';
import type { Teacher } from '@/types/teachers';

async function runTeacherFormCreate(
	selectedUserId: string,
	form: TeacherFormState,
): Promise<{ ok: true; userId: string } | { ok: false }> {
	const teacherData = await createTeacherRecord(selectedUserId, form);
	if (!teacherData) {
		toast.error('Fout bij aanmaken docent', { description: 'Onbekende fout' });
		return { ok: false };
	}

	const linkError = await linkTeacherLessonTypes(teacherData.user_id, form.lesson_type_ids);
	if (linkError) {
		toast.warning('Docent aangemaakt', {
			description: 'Docent is aangemaakt, maar lessoorten konden niet worden gekoppeld.',
		});
	} else {
		toast.success('Docent aangemaakt');
	}

	return { ok: true, userId: teacherData.user_id };
}

async function runTeacherFormEdit(teacher: Teacher, form: TeacherFormState): Promise<{ ok: true } | { ok: false }> {
	const teacherError = await updateTeacherBio(teacher.user_id, form.bio);
	if (teacherError) {
		toast.error('Fout bij bijwerken docent', { description: teacherError });
		return { ok: false };
	}

	const profileError = await updateTeacherProfileFields(teacher.user_id, form);
	if (profileError) {
		toast.error('Fout bij bijwerken profiel', { description: profileError });
		return { ok: false };
	}

	const { addError, removeError } = await syncTeacherLessonTypes(teacher.user_id, form.lesson_type_ids);
	if (addError) {
		toast.error('Fout bij toevoegen lessoorten', { description: addError });
		return { ok: false };
	}
	if (removeError) {
		toast.error('Fout bij verwijderen lessoorten', { description: removeError });
		return { ok: false };
	}

	toast.success('Docent bijgewerkt');
	return { ok: true };
}

function validateTeacherFormSubmit(isEditMode: boolean, selectedUserId: string | null): boolean {
	if (isEditMode) {
		return true;
	}
	if (selectedUserId) {
		return true;
	}
	toast.error('Selecteer een bestaande gebruiker of maak een nieuwe aan');
	return false;
}

export type TeacherFormDialogSubmitOutcome =
	| { kind: 'edit-success' }
	| { kind: 'create-success'; userId: string }
	| { kind: 'validation-failed' }
	| { kind: 'action-failed' };

export async function executeTeacherFormDialogSubmit(params: {
	isEditMode: boolean;
	teacher: Teacher | undefined;
	selectedUserId: string | null;
	form: TeacherFormState;
}): Promise<TeacherFormDialogSubmitOutcome> {
	if (!validateTeacherFormSubmit(params.isEditMode, params.selectedUserId)) {
		return { kind: 'validation-failed' };
	}

	if (params.isEditMode && params.teacher) {
		const result = await runTeacherFormEdit(params.teacher, params.form);
		return result.ok ? { kind: 'edit-success' } : { kind: 'action-failed' };
	}

	if (params.selectedUserId) {
		const result = await runTeacherFormCreate(params.selectedUserId, params.form);
		return result.ok ? { kind: 'create-success', userId: result.userId } : { kind: 'action-failed' };
	}

	return { kind: 'action-failed' };
}
