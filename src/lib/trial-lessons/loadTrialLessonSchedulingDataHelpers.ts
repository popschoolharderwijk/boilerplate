import type { AvailabilitySlot, ExistingAgreementForSlot, ExistingTrialLessonForSlot } from '@/lib/agreementSlots';
import type { TrialLessonSchedulingTeacher } from '@/lib/trial-lessons/loadTrialLessonSchedulingData';
import { mapTeacherInfoFromProfile } from '@/lib/trial-lessons/scheduleTrialLessonSlotHelpers';
import type { LessonFrequency } from '@/types/lesson-agreements';

export interface TeacherLessonTypeRow {
	teacher_user_id: string;
}

export interface TeacherRow {
	user_id: string;
}

export interface ProfileRow {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	avatar_url: string | null;
}

export interface AvailabilityRow {
	teacher_user_id: string;
	day_of_week: number;
	start_time: string;
	end_time: string;
}

export interface AgreementRow {
	teacher_user_id: string;
	day_of_week: number;
	start_time: string;
	start_date: string;
	end_date: string | null;
	duration_minutes: number;
	frequency: string;
}

export interface TrialRow {
	teacher_user_id: string;
	scheduled_date: string;
	scheduled_start_time: string;
	duration_minutes: number;
	status: string;
}

export function mapTeacherIdsFromLessonTypes(rows: TeacherLessonTypeRow[]): string[] {
	return rows.map((row) => row.teacher_user_id);
}

export function mapTeacherIdsFromTeachers(rows: TeacherRow[]): string[] {
	return rows.map((row) => row.user_id);
}

export function buildTeachersMap(profiles: ProfileRow[]): Map<string, TrialLessonSchedulingTeacher> {
	const teachers = new Map<string, TrialLessonSchedulingTeacher>();
	for (const profile of profiles) {
		teachers.set(profile.user_id, mapTeacherInfoFromProfile(profile));
	}
	return teachers;
}

export function groupAvailabilityByTeacher(slots: AvailabilityRow[]): Map<string, AvailabilitySlot[]> {
	const availabilityByTeacher = new Map<string, AvailabilitySlot[]>();
	for (const slot of slots) {
		const arr = availabilityByTeacher.get(slot.teacher_user_id) ?? [];
		arr.push({ day_of_week: slot.day_of_week, start_time: slot.start_time, end_time: slot.end_time });
		availabilityByTeacher.set(slot.teacher_user_id, arr);
	}
	return availabilityByTeacher;
}

export function groupAgreementsByTeacher(
	agreements: AgreementRow[],
	fromDate: string,
): Map<string, ExistingAgreementForSlot[]> {
	const agreementsByTeacher = new Map<string, ExistingAgreementForSlot[]>();
	for (const agreement of agreements) {
		if (agreement.end_date !== null && agreement.end_date < fromDate) continue;
		const arr = agreementsByTeacher.get(agreement.teacher_user_id) ?? [];
		arr.push({
			day_of_week: agreement.day_of_week,
			start_time: agreement.start_time,
			start_date: agreement.start_date,
			end_date: agreement.end_date,
			duration_minutes: agreement.duration_minutes,
			frequency: agreement.frequency as LessonFrequency,
		});
		agreementsByTeacher.set(agreement.teacher_user_id, arr);
	}
	return agreementsByTeacher;
}

export function groupTrialsByTeacher(trials: TrialRow[]): Map<string, ExistingTrialLessonForSlot[]> {
	const trialsByTeacher = new Map<string, ExistingTrialLessonForSlot[]>();
	for (const trial of trials) {
		if (trial.status === 'cancelled') continue;
		const arr = trialsByTeacher.get(trial.teacher_user_id) ?? [];
		arr.push({
			teacher_user_id: trial.teacher_user_id,
			scheduled_date: trial.scheduled_date,
			scheduled_start_time: trial.scheduled_start_time,
			duration_minutes: trial.duration_minutes,
		});
		trialsByTeacher.set(trial.teacher_user_id, arr);
	}
	return trialsByTeacher;
}
