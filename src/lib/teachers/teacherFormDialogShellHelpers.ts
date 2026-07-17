import type { TeacherFormState } from '@/lib/teachers/teacherFormDialogHelpers';

export interface TeacherFormDialogCopy {
	title: string;
	description: string;
}

export function resolveTeacherFormDialogCopy(isEditMode: boolean, form: TeacherFormState): TeacherFormDialogCopy {
	if (isEditMode) {
		return {
			title: 'Docent bewerken',
			description: `Wijzig de gegevens van ${form.first_name || form.email}.`,
		};
	}

	return {
		title: 'Nieuwe docent toevoegen',
		description: 'Voeg een nieuwe docent toe aan het systeem.',
	};
}

export function resolveTeacherFormSubmitDisabled(
	isEditMode: boolean,
	form: TeacherFormState,
	selectedUserId: string | null,
): boolean {
	if (isEditMode) {
		return !form.email;
	}
	return !selectedUserId;
}

export function shouldBlockTeacherFormClose(saving: boolean): boolean {
	return saving;
}

export function resolveTeacherFormSubmitLabel(isEditMode: boolean): { idle: string; loading: string } {
	if (isEditMode) {
		return { idle: 'Opslaan', loading: 'Opslaan...' };
	}
	return { idle: 'Toevoegen', loading: 'Toevoegen...' };
}
