import type { UserOptional } from '@/types/users';

export function hasConfirmStepSelectedUser(selectedUser: UserOptional | null): boolean {
	return selectedUser !== null;
}

export function resolveConfirmStepStudentHref(userId: string | null | undefined): string | undefined {
	return userId ? `/students/${userId}` : undefined;
}

export function resolveConfirmStepTeacherHref(userId: string | null | undefined): string | undefined {
	return userId ? `/teachers/${userId}` : undefined;
}
