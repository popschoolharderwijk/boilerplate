import { getUserInitials } from '@/components/ui/user-display';
import { getDisplayName } from '@/lib/display-name';
import type { PaginatedStudentsResponseRaw, StudentWithAgreements } from '@/types/students';
import { flattenStudentWithAgreements } from '@/types/students';

export function shouldRedirectMyStudents(authLoading: boolean, isTeacher: boolean): boolean {
	return !authLoading && !isTeacher;
}

export function shouldShowMyStudentsSkeleton(authLoading: boolean, loading: boolean): boolean {
	return authLoading || loading;
}

export function shouldSkipMyStudentsLoad(
	authLoading: boolean,
	isTeacher: boolean,
	teacherUserId: string | null | undefined,
): boolean {
	return authLoading || !isTeacher || !teacherUserId;
}

export interface MyStudentsLoadParams {
	limit: number;
	offset: number;
	search: string | null;
}

export function buildMyStudentsLoadParams(
	currentPage: number,
	rowsPerPage: number,
	search: string,
): MyStudentsLoadParams {
	return {
		limit: rowsPerPage,
		offset: (currentPage - 1) * rowsPerPage,
		search: search || null,
	};
}

export type MyStudentsLoadOutcome =
	| { kind: 'success'; students: StudentWithAgreements[]; totalCount: number }
	| { kind: 'error' };

export function applyMyStudentsLoadOutcome(
	outcome: MyStudentsLoadOutcome,
	setStudents: (students: StudentWithAgreements[]) => void,
	setTotalCount: (count: number) => void,
): void {
	if (outcome.kind !== 'success') return;
	setStudents(outcome.students);
	setTotalCount(outcome.totalCount);
}

export function mapMyStudentsPaginatedResponse(data: unknown): MyStudentsLoadOutcome {
	const result = data as PaginatedStudentsResponseRaw;
	return {
		kind: 'success',
		students: (result.data ?? []).map(flattenStudentWithAgreements),
		totalCount: result.total_count ?? 0,
	};
}

export function myStudentDisplayName(student: StudentWithAgreements): string {
	return getDisplayName({
		first_name: student.first_name,
		last_name: student.last_name,
		email: student.email,
	});
}

export function myStudentInitials(student: StudentWithAgreements): string {
	return getUserInitials({
		first_name: student.first_name,
		last_name: student.last_name,
		email: student.email,
	});
}

export interface MyStudentLessonTypeBadge {
	key: string;
	name: string;
}

export function collectMyStudentLessonTypes(student: StudentWithAgreements): MyStudentLessonTypeBadge[] {
	const types = new Map<string, MyStudentLessonTypeBadge>();
	for (const agreement of student.agreements) {
		if (!agreement.lesson_type) continue;
		types.set(agreement.lesson_type.id, {
			key: agreement.lesson_type.id,
			name: agreement.lesson_type.name,
		});
	}
	return Array.from(types.values());
}

export function hasMyStudentLessonTypes(student: StudentWithAgreements): boolean {
	return collectMyStudentLessonTypes(student).length > 0;
}

export function hasMyStudentAgreements(student: StudentWithAgreements): boolean {
	return student.agreements.length > 0;
}
