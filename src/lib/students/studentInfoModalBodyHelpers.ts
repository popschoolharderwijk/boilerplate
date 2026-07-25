import type { Student } from '@/types/students';

export interface StudentInfoModalView {
	dateOfBirth: string | null;
	showDateOfBirth: boolean;
	showPrivilegedBlock: boolean;
	showLimitedAccessNotice: boolean;
}

export function buildStudentInfoModalView(fullData: Student | null, canViewFullData: boolean): StudentInfoModalView {
	const dateOfBirth = fullData?.date_of_birth ?? null;
	return {
		dateOfBirth,
		showDateOfBirth: Boolean(dateOfBirth),
		showPrivilegedBlock: canViewFullData && fullData !== null,
		showLimitedAccessNotice: !canViewFullData,
	};
}
