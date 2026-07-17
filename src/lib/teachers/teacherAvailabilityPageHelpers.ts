import type { Tables } from '@/integrations/supabase/types';
import type { TeacherAvailabilityOverviewTeacher } from '@/lib/teachers/loadTeacherAvailabilityOverview';

type Availability = Tables<'teacher_availability'>;

export function filterTeacherAvailability(
	availability: Availability[],
	selectedTeacherUserId: string | 'all',
): Availability[] {
	if (selectedTeacherUserId === 'all') return availability;
	return availability.filter((slot) => slot.teacher_user_id === selectedTeacherUserId);
}

export function groupAvailabilityByDay(availability: Availability[]): Record<number, Availability[]> {
	const availabilityByDay: Record<number, Availability[]> = {};
	for (const slot of availability) {
		const daySlots = availabilityByDay[slot.day_of_week] ?? [];
		daySlots.push(slot);
		availabilityByDay[slot.day_of_week] = daySlots;
	}
	return availabilityByDay;
}

export function shouldShowTeacherNameOnAvailabilitySlot(selectedTeacherUserId: string | 'all'): boolean {
	return selectedTeacherUserId === 'all';
}

export function findTeacherForAvailabilitySlot(
	teachers: TeacherAvailabilityOverviewTeacher[],
	teacherUserId: string,
): TeacherAvailabilityOverviewTeacher | undefined {
	return teachers.find((teacher) => teacher.user_id === teacherUserId);
}
