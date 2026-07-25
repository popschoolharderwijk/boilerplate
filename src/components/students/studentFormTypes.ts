import type { Student } from '@/types/students';

export interface StudentFormState {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	date_of_birth: string | null;
	parent_name: string;
	parent_email: string;
	parent_phone_number: string;
	debtor_info_same_as_student: boolean;
	debtor_name: string;
	debtor_address: string;
	debtor_postal_code: string;
	debtor_city: string;
}

export type StudentFormMode = 'new-user' | 'existing-user';

export const emptyStudentForm: StudentFormState = {
	email: '',
	first_name: '',
	last_name: '',
	phone_number: '',
	date_of_birth: null,
	parent_name: '',
	parent_email: '',
	parent_phone_number: '',
	debtor_info_same_as_student: true,
	debtor_name: '',
	debtor_address: '',
	debtor_postal_code: '',
	debtor_city: '',
};

export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
	return /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));
}

export function studentRecordFields(form: StudentFormState) {
	return {
		date_of_birth: form.date_of_birth || null,
		parent_name: form.parent_name || null,
		parent_email: form.parent_email || null,
		parent_phone_number: form.parent_phone_number || null,
		debtor_info_same_as_student: form.debtor_info_same_as_student,
		debtor_name: form.debtor_info_same_as_student ? null : form.debtor_name || null,
		debtor_address: form.debtor_info_same_as_student ? null : form.debtor_address || null,
		debtor_postal_code: form.debtor_info_same_as_student ? null : form.debtor_postal_code || null,
		debtor_city: form.debtor_info_same_as_student ? null : form.debtor_city || null,
	};
}

export function studentFormFromStudent(student: Student): StudentFormState {
	return {
		email: student.email ?? '',
		first_name: student.first_name ?? '',
		last_name: student.last_name ?? '',
		phone_number: student.phone_number ?? '',
		date_of_birth: student.date_of_birth ?? null,
		parent_name: student.parent_name ?? '',
		parent_email: student.parent_email ?? '',
		parent_phone_number: student.parent_phone_number ?? '',
		debtor_info_same_as_student: student.debtor_info_same_as_student,
		debtor_name: student.debtor_name ?? '',
		debtor_address: student.debtor_address ?? '',
		debtor_postal_code: student.debtor_postal_code ?? '',
		debtor_city: student.debtor_city ?? '',
	};
}
