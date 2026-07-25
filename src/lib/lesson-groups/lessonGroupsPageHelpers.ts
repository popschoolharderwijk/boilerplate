import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
	buildMemberMap,
	type LessonGroupMemberInfo,
	type LessonGroupTableRow,
	mapLessonGroupTableRow,
} from '@/lib/lesson-groups/lessonGroupsMappers';
import {
	computeLessonGroupEndTime,
	computeLessonGroupFirstDate,
} from '@/lib/lesson-groups/lessonGroupsScheduleHelpers';

export type { LessonGroupMemberInfo, LessonGroupTableRow };

export const LESSON_GROUP_DAY_LABELS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export async function fetchLessonGroupTableRows(client: SupabaseClient): Promise<LessonGroupTableRow[]> {
	const { data: groupsData, error } = await client.from('lesson_groups').select('*').order('name');
	if (error) throw error;

	const groups = groupsData ?? [];
	if (!groups.length) return [];

	const lessonTypeIds = [...new Set(groups.map((group) => group.lesson_type_id))];
	const teacherIds = [...new Set(groups.map((group) => group.teacher_user_id))];
	const groupIds = groups.map((group) => group.id);

	const [lessonTypesRes, profilesRes, membersRes] = await Promise.all([
		client.from('lesson_types').select('id, name').in('id', lessonTypeIds),
		client
			.from('view_profiles_with_display_name')
			.select('user_id, first_name, last_name, email, avatar_url')
			.in('user_id', teacherIds),
		client
			.from('lesson_group_members')
			.select('lesson_group_id, student_user_id')
			.in('lesson_group_id', groupIds)
			.is('left_date', null),
	]);

	const memberRows = membersRes.data ?? [];
	const studentIds = [...new Set(memberRows.map((member) => member.student_user_id))];
	const { data: studentProfiles } = studentIds.length
		? await client
				.from('view_profiles_with_display_name')
				.select('user_id, first_name, last_name, email')
				.in('user_id', studentIds)
		: { data: [] };

	const studentMap = new Map((studentProfiles ?? []).map((profile) => [profile.user_id, profile]));
	const lessonTypeMap = new Map((lessonTypesRes.data ?? []).map((lessonType) => [lessonType.id, lessonType]));
	const profileMap = new Map((profilesRes.data ?? []).map((profile) => [profile.user_id, profile]));
	const groupMembers = buildMemberMap(memberRows, studentMap);

	return groups.map((group) => mapLessonGroupTableRow(group, lessonTypeMap, profileMap, groupMembers));
}

export async function scheduleLessonGroupInAgenda(group: LessonGroupTableRow): Promise<{ error: Error | null }> {
	const firstDateStr = computeLessonGroupFirstDate(group.start_date, group.day_of_week);
	const endTime = computeLessonGroupEndTime(group.start_time, group.duration_minutes);
	const { error } = await supabase.from('agenda_events').insert({
		source_type: 'lesson_group',
		source_id: group.id,
		owner_user_id: group.teacher_user_id,
		title: group.name,
		start_date: firstDateStr,
		start_time: group.start_time,
		end_date: firstDateStr,
		end_time: endTime,
		is_all_day: false,
		recurring: true,
		recurring_frequency: group.frequency,
		recurring_end_date: group.end_date,
	});
	return { error: error ? new Error(error.message) : null };
}

export function formatLessonGroupMemberLabel(member: LessonGroupMemberInfo): string {
	return [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || 'Onbekend';
}
