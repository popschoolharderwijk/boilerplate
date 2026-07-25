import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { indexByUserId } from '@/lib/collections';
import { getDisplayName } from '@/lib/display-name';

type TrialLessonRow = Tables<'trial_lessons'>;

type TrialLessonProfile = {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
};

export type EnrichedTrialLessonStudent = TrialLessonRow & {
	teacher_name: string;
	lesson_type_name: string | null;
};

export type EnrichedTrialLessonStaff = EnrichedTrialLessonStudent & {
	student_name: string;
	student_email: string;
};

interface EnrichOptions {
	includeStudent?: boolean;
}

function enrichSingleTrialLesson<T extends TrialLessonRow>(
	trial: T,
	profileMap: Map<string, TrialLessonProfile>,
	lessonTypeMap: Map<string, string>,
	includeStudent: boolean,
): (T & EnrichedTrialLessonStaff) | (T & EnrichedTrialLessonStudent) {
	const teacherProfile = profileMap.get(trial.teacher_user_id);
	const base = {
		...trial,
		teacher_name: teacherProfile ? getDisplayName(teacherProfile) : '—',
		lesson_type_name: lessonTypeMap.get(trial.lesson_type_id) ?? null,
	};

	if (!includeStudent) {
		return base;
	}

	const studentProfile = profileMap.get(trial.student_user_id);
	return {
		...base,
		student_name: studentProfile ? getDisplayName(studentProfile) : '—',
		student_email: studentProfile?.email ?? '',
	};
}

export async function enrichTrialLessons<T extends TrialLessonRow>(
	trials: T[],
	options: EnrichOptions = {},
): Promise<(T & EnrichedTrialLessonStaff)[] | (T & EnrichedTrialLessonStudent)[]> {
	const userIds = Array.from(
		new Set(
			trials.flatMap((trial) =>
				options.includeStudent ? [trial.student_user_id, trial.teacher_user_id] : [trial.teacher_user_id],
			),
		),
	);
	const lessonTypeIds = Array.from(new Set(trials.map((trial) => trial.lesson_type_id)));

	const [profilesRes, lessonTypesRes] = await Promise.all([
		userIds.length > 0
			? supabase.from('profiles').select('user_id, first_name, last_name, email').in('user_id', userIds)
			: Promise.resolve({ data: [], error: null }),
		lessonTypeIds.length > 0
			? supabase.from('lesson_types').select('id, name').in('id', lessonTypeIds)
			: Promise.resolve({ data: [], error: null }),
	]);

	const profileMap = indexByUserId(profilesRes.data ?? []);
	const lessonTypeMap = new Map((lessonTypesRes.data ?? []).map((lt) => [lt.id, lt.name] as const));
	const includeStudent = options.includeStudent ?? false;

	const enriched: ((T & EnrichedTrialLessonStaff) | (T & EnrichedTrialLessonStudent))[] = [];
	for (const trial of trials) {
		enriched.push(enrichSingleTrialLesson(trial, profileMap, lessonTypeMap, includeStudent));
	}
	return enriched;
}
