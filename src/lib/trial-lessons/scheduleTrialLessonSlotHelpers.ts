import type { FreeSlotForTeacher } from '@/lib/agreementSlots';
import type { TeacherDisplayInfo } from '@/lib/trial-lessons/scheduleTrialLessonHelpers';

export function isTrialLessonSlotSelected(selected: FreeSlotForTeacher | null, slot: FreeSlotForTeacher): boolean {
	if (!selected) return false;
	return (
		selected.date === slot.date &&
		selected.start_time === slot.start_time &&
		selected.teacher_user_id === slot.teacher_user_id
	);
}

export function getTrialLessonSlotKey(slot: FreeSlotForTeacher): string {
	return `${slot.date}-${slot.start_time}-${slot.teacher_user_id}`;
}

export function mapTeacherInfoFromProfile(profile: {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	avatar_url: string | null;
}): { userId: string } & TeacherDisplayInfo {
	return {
		userId: profile.user_id,
		firstName: profile.first_name ?? null,
		lastName: profile.last_name ?? null,
		avatarUrl: profile.avatar_url ?? null,
	};
}
