import type { Student } from '@/types/students';

export interface StudentRecordFields {
	id: string;
	user_id: string;
	date_of_birth: string | null;
	parent_name: string | null;
	parent_email: string | null;
	parent_phone_number: string | null;
	debtor_info_same_as_student: boolean;
	debtor_name: string | null;
	debtor_address: string | null;
	debtor_postal_code: string | null;
	debtor_city: string | null;
	created_at: string;
	updated_at: string;
	created_by: string | null;
	updated_by: string | null;
}

export interface StudentProfileFields {
	user_id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	avatar_url: string | null;
	phone_number: string | null;
}

export function mergeStudentWithProfile(studentData: StudentRecordFields, profileData: StudentProfileFields): Student {
	return {
		...studentData,
		...profileData,
	} as Student;
}

export function shouldLoadStudentInfoModal(open: boolean, student: { user_id: string } | null): boolean {
	return open && student !== null;
}

export function shouldResetStudentInfoModal(open: boolean, student: { user_id: string } | null): boolean {
	return !open || student === null;
}
