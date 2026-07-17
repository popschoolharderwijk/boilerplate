import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayName } from '@/lib/display-name';
import { mapTeachersSortColumn } from '@/lib/teachers/teacherFormDialogHelpers';
import {
	flattenTeacherWithLessonTypes,
	type PaginatedTeachersResponseRaw,
	type TeacherWithLessonTypes,
} from '@/types/teachers';

export interface FetchTeachersPaginatedParams {
	limit: number;
	offset: number;
	search: string | null;
	status: string;
	lessonTypeId: string | null;
	sortColumn: string | null;
	sortDirection: string | null;
}

export interface FetchTeachersPaginatedResult {
	teachers: TeacherWithLessonTypes[];
	totalCount: number;
	error: string | null;
}

export async function fetchTeachersPaginated(
	params: FetchTeachersPaginatedParams,
): Promise<FetchTeachersPaginatedResult> {
	const { data, error } = await supabase.rpc('get_teachers_paginated', {
		p_limit: params.limit,
		p_offset: params.offset,
		p_search: params.search ?? undefined,
		p_status: params.status,
		p_lesson_type_id: params.lessonTypeId ?? undefined,
		p_sort_column: mapTeachersSortColumn(params.sortColumn),
		p_sort_direction: params.sortDirection || 'asc',
	});

	if (error) {
		return { teachers: [], totalCount: 0, error: error.message };
	}

	const result = data as unknown as PaginatedTeachersResponseRaw;
	return {
		teachers: (result.data ?? []).map(flattenTeacherWithLessonTypes),
		totalCount: result.total_count ?? 0,
		error: null,
	};
}

export async function deleteTeacher(teacher: TeacherWithLessonTypes): Promise<void> {
	const { error } = await supabase.from('teachers').delete().eq('user_id', teacher.user_id);
	if (error) {
		console.error('Error deleting teacher:', error);
		toast.error('Fout bij verwijderen docent', { description: error.message });
		throw new Error(error.message);
	}

	toast.success('Docent verwijderd', {
		description: `${getDisplayName(teacher)} is verwijderd.`,
	});
}
