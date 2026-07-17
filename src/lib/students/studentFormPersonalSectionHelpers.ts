import type { StudentFormMode } from '@/components/students/studentFormTypes';

export function isStudentPersonalNameFieldDisabled(isEditMode: boolean, mode: StudentFormMode): boolean {
	return isEditMode && mode === 'existing-user';
}

export function isStudentEmailFieldDisabled(isEditMode: boolean, mode: StudentFormMode): boolean {
	return isEditMode || mode === 'existing-user';
}

export function shouldShowStudentEmailImmutableHint(isEditMode: boolean): boolean {
	return isEditMode;
}
