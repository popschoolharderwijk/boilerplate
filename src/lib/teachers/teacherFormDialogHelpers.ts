import type { Teacher } from '@/types/teachers';

export interface TeacherFormState {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	bio: string;
	lesson_type_ids: string[];
}

export const EMPTY_TEACHER_FORM: TeacherFormState = {
	email: '',
	first_name: '',
	last_name: '',
	phone_number: '',
	bio: '',
	lesson_type_ids: [],
};

export function teacherFormFromTeacher(teacher: Teacher): TeacherFormState {
	return {
		email: teacher.email ?? '',
		first_name: teacher.first_name ?? '',
		last_name: teacher.last_name ?? '',
		phone_number: teacher.phone_number ?? '',
		bio: teacher.bio ?? '',
		lesson_type_ids: [],
	};
}

export function teacherFormFromExistingProfile(email: string): TeacherFormState {
	return {
		email,
		first_name: '',
		last_name: '',
		phone_number: '',
		bio: '',
		lesson_type_ids: [],
	};
}

export function diffLessonTypeIds(currentIds: string[], newIds: string[]): { toAdd: string[]; toRemove: string[] } {
	const currentSet = new Set(currentIds);
	const newSet = new Set(newIds);
	return {
		toAdd: newIds.filter((id) => !currentSet.has(id)),
		toRemove: currentIds.filter((id) => !newSet.has(id)),
	};
}

const TEACHERS_TABLE_COLUMN_MAPPING: Record<string, string> = {
	teacher: 'name',
	phone_number: 'phone_number',
	is_active: 'status',
	created_at: 'created_at',
};

export function mapTeachersSortColumn(sortColumn: string | null): string {
	if (!sortColumn) return 'name';
	return TEACHERS_TABLE_COLUMN_MAPPING[sortColumn] ?? 'name';
}
