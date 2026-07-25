import type { TeacherAvailability } from '@/lib/teachers/teacherAvailabilityApi';

export type MyAvailabilityPageGate = 'auth-loading' | 'denied' | 'ready';

export function resolveMyAvailabilityPageGate(authLoading: boolean, isTeacher: boolean): MyAvailabilityPageGate {
	if (authLoading) return 'auth-loading';
	if (!isTeacher) return 'denied';
	return 'ready';
}

export function validateAvailabilityTimeRange(startTime: string, endTime: string): boolean {
	return startTime < endTime;
}

export function groupAvailabilityByDay(availability: TeacherAvailability[]): Record<number, TeacherAvailability[]> {
	const availabilityByDay: Record<number, TeacherAvailability[]> = {};

	for (const slot of availability) {
		const daySlots = availabilityByDay[slot.day_of_week] ?? [];
		daySlots.push(slot);
		availabilityByDay[slot.day_of_week] = daySlots;
	}

	return availabilityByDay;
}
