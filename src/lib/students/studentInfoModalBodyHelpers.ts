import type { Student } from '@/types/students';

export function shouldShowStudentDateOfBirth(dateOfBirth: string | null | undefined): boolean {
	return Boolean(dateOfBirth);
}
export function shouldShowStudentLimitedAccessNotice(canViewFullData: boolean): boolean {
	return !canViewFullData;
}

export function resolveStudentInfoDateOfBirth(fullData: Student | null): string | null {
	return fullData?.date_of_birth ?? null;
}

export function shouldRenderStudentInfoPrivilegedBlock(
	canViewFullData: boolean,
	fullData: Student | null,
): fullData is Student {
	return canViewFullData && fullData !== null;
}
