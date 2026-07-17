import type { StudentFormMode } from '@/components/students/studentFormTypes';

export function shouldRenderStudentFormModeSection(isEditMode: boolean): boolean {
	return !isEditMode;
}

export function shouldShowExistingUserPicker(mode: StudentFormMode): boolean {
	return mode === 'existing-user';
}

export function getStudentFormModeButtonVariant(
	currentMode: StudentFormMode,
	targetMode: StudentFormMode,
): 'default' | 'outline' {
	return currentMode === targetMode ? 'default' : 'outline';
}
