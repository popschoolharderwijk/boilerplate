import type { SlotWithStatus } from '@/lib/agreementSlots';

interface TeacherOption {
	id: string;
	userId: string;
}

interface SelectedUser {
	user_id: string;
}

export function groupTeacherSlotsByDay(slotsWithStatus: SlotWithStatus[]): Map<number, SlotWithStatus[]> {
	const slotsByDay = new Map<number, SlotWithStatus[]>();
	for (const slot of slotsWithStatus) {
		const daySlots = slotsByDay.get(slot.day_of_week) ?? [];
		if (daySlots.length === 0) slotsByDay.set(slot.day_of_week, daySlots);
		daySlots.push(slot);
	}
	for (const daySlots of slotsByDay.values()) {
		daySlots.sort((left, right) => (left.start_time || '').localeCompare(right.start_time || ''));
	}
	return slotsByDay;
}

export function resolveTeacherSelectionId(teachers: TeacherOption[], user: SelectedUser | null): string | null {
	if (!user) return null;
	const teacher = teachers.find((entry) => entry.userId === user.user_id);
	return teacher?.id ?? user.user_id;
}
