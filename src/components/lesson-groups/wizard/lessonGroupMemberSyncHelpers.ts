import type { SupabaseClient } from '@supabase/supabase-js';
import { computeGroupMemberSyncPlan } from '@/components/lesson-groups/wizard/lessonGroupMemberSyncPlan';

async function fetchActiveGroupMembers(
	supabase: SupabaseClient,
	groupId: string,
): Promise<{ id: string; student_user_id: string }[]> {
	const { data } = await supabase
		.from('lesson_group_members')
		.select('id, student_user_id')
		.eq('lesson_group_id', groupId)
		.is('left_date', null);
	return data ?? [];
}

async function insertGroupMembers(supabase: SupabaseClient, groupId: string, studentUserIds: string[]): Promise<void> {
	if (!studentUserIds.length) return;
	const { error } = await supabase
		.from('lesson_group_members')
		.insert(studentUserIds.map((studentUserId) => ({ lesson_group_id: groupId, student_user_id: studentUserId })));
	if (error) throw error;
}

async function removeGroupMembers(supabase: SupabaseClient, memberIds: string[]): Promise<void> {
	for (const memberId of memberIds) {
		await supabase.from('lesson_group_members').delete().eq('id', memberId);
	}
}

export async function applyGroupMemberSync(
	supabase: SupabaseClient,
	groupId: string,
	memberIds: string[],
): Promise<void> {
	const existing = await fetchActiveGroupMembers(supabase, groupId);
	const { toAdd, toRemoveIds } = computeGroupMemberSyncPlan(existing, memberIds);
	await insertGroupMembers(supabase, groupId, toAdd);
	await removeGroupMembers(supabase, toRemoveIds);
}
