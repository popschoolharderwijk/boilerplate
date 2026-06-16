import type { LessonAgreement } from '@/components/students/LessonAgreementItem';
import { supabase } from '@/integrations/supabase/client';
import { fetchLessonTypesByIds } from '@/lib/lesson-types/fetchLessonTypesByIds';
import { fetchTeacherProfilesByUserIds } from '@/lib/profiles/fetchTeacherProfilesByUserIds';
import type { LessonAgreementWithTeacher, LessonFrequency } from '@/types/lesson-agreements';

type AgreementRow = {
	id: string;
	day_of_week: number;
	start_time: string;
	start_date: string;
	end_date: string | null;
	is_active: boolean;
	notes: string | null;
	duration_minutes: number;
	frequency: LessonFrequency;
	price_per_lesson: number;
	teacher_user_id: string;
	lesson_type_id: string;
};

function mapAgreementRow(
	row: AgreementRow,
	teacherById: Map<string, { first_name: string | null; last_name: string | null; avatar_url: string | null }>,
	lessonTypeById: Map<string, { id: string; name: string; icon: string | null; color: string | null }>,
): LessonAgreementWithTeacher {
	const teacher = teacherById.get(row.teacher_user_id);
	const lessonType = lessonTypeById.get(row.lesson_type_id);
	return {
		id: row.id,
		day_of_week: row.day_of_week,
		start_time: row.start_time,
		start_date: row.start_date,
		end_date: row.end_date,
		is_active: row.is_active,
		notes: row.notes,
		duration_minutes: row.duration_minutes,
		frequency: row.frequency,
		price_per_lesson: row.price_per_lesson,
		teacher: {
			first_name: teacher?.first_name ?? null,
			last_name: teacher?.last_name ?? null,
			avatar_url: teacher?.avatar_url ?? null,
		},
		lesson_type: {
			id: lessonType?.id ?? row.lesson_type_id,
			name: lessonType?.name ?? '',
			icon: lessonType?.icon ?? null,
			color: lessonType?.color ?? null,
		},
	};
}

export async function fetchStudentAgreementsWithRelations(
	studentUserId: string,
): Promise<LessonAgreementWithTeacher[]> {
	const { data, error } = await supabase
		.from('lesson_agreements')
		.select(
			'id, day_of_week, start_time, start_date, end_date, is_active, notes, duration_minutes, frequency, price_per_lesson, teacher_user_id, lesson_type_id',
		)
		.eq('student_user_id', studentUserId)
		.order('day_of_week', { ascending: true })
		.order('start_time', { ascending: true });

	if (error) {
		throw error;
	}

	const rows = (data ?? []) as AgreementRow[];
	const teacherIds = Array.from(new Set(rows.map((r) => r.teacher_user_id)));
	const lessonTypeIds = Array.from(new Set(rows.map((r) => r.lesson_type_id)));

	const [teacherById, lessonTypeById] = await Promise.all([
		fetchTeacherProfilesByUserIds(teacherIds),
		fetchLessonTypesByIds(lessonTypeIds),
	]);

	return rows.map((row) => mapAgreementRow(row, teacherById, lessonTypeById));
}

export async function fetchStudentAgreementsForProfile(studentUserId: string): Promise<LessonAgreement[]> {
	return fetchStudentAgreementsWithRelations(studentUserId);
}
