import type { LessonGroupRow } from '@/types/lesson-groups';

export interface LessonGroupMemberInfo {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

export interface LessonGroupTableRow extends LessonGroupRow {
	lesson_type_name: string;
	teacher_first_name: string | null;
	teacher_last_name: string | null;
	teacher_email: string | null;
	teacher_avatar_url: string | null;
	members: LessonGroupMemberInfo[];
}

type ProfileRow = {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	avatar_url?: string | null;
};

export function buildMemberMap(
	memberRows: Array<{ lesson_group_id: string; student_user_id: string }>,
	studentMap: Map<string, ProfileRow>,
): Map<string, LessonGroupMemberInfo[]> {
	const groupMembers = new Map<string, LessonGroupMemberInfo[]>();
	for (const member of memberRows) {
		const members = groupMembers.get(member.lesson_group_id) ?? [];
		const studentProfile = studentMap.get(member.student_user_id);
		members.push({
			user_id: member.student_user_id,
			first_name: studentProfile?.first_name ?? null,
			last_name: studentProfile?.last_name ?? null,
			email: studentProfile?.email ?? null,
		});
		groupMembers.set(member.lesson_group_id, members);
	}
	return groupMembers;
}

export function mapLessonGroupTableRow(
	group: LessonGroupRow,
	lessonTypeMap: Map<string, { name: string }>,
	profileMap: Map<string, ProfileRow>,
	groupMembers: Map<string, LessonGroupMemberInfo[]>,
): LessonGroupTableRow {
	const lessonType = lessonTypeMap.get(group.lesson_type_id);
	const teacher = profileMap.get(group.teacher_user_id);
	return {
		...group,
		lesson_type_name: lessonType?.name ?? '—',
		teacher_first_name: teacher?.first_name ?? null,
		teacher_last_name: teacher?.last_name ?? null,
		teacher_email: teacher?.email ?? null,
		teacher_avatar_url: teacher?.avatar_url ?? null,
		members: groupMembers.get(group.id) ?? [],
	};
}
