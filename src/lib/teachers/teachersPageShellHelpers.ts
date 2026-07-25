import type { Teacher } from '@/types/teachers';

export function shouldShowTeachersPage(isAdmin: boolean, isSiteAdmin: boolean): boolean {
	return isAdmin || isSiteAdmin;
}

export function buildTeacherFormDialogOpenChangeHandler(
	currentTeacher: Teacher | null,
	setTeacherFormDialog: (value: { open: boolean; teacher: Teacher | null }) => void,
): (open: boolean) => void {
	return (open) => setTeacherFormDialog({ open, teacher: currentTeacher });
}
