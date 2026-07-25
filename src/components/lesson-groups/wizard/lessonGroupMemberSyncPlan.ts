export function computeGroupMemberSyncPlan(
	existingMembers: { id: string; student_user_id: string }[],
	desiredMemberIds: string[],
): { toAdd: string[]; toRemoveIds: string[] } {
	const existingMap = new Map(existingMembers.map((member) => [member.student_user_id, member.id]));
	const wanted = new Set(desiredMemberIds);
	const toAdd = desiredMemberIds.filter((memberId) => !existingMap.has(memberId));
	const toRemoveIds = existingMembers
		.filter((member) => !wanted.has(member.student_user_id))
		.map((member) => member.id);
	return { toAdd, toRemoveIds };
}
