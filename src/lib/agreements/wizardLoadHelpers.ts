import { WizardStep } from '@/components/agreements/WizardStepIndicator';
import { supabase } from '@/integrations/supabase/client';
import { mapRawAgreementToTableRow, type RawAgreementRow } from '@/lib/agreements/mapAgreementTableRow';
import type { AgreementTableRow, LessonFrequency } from '@/types/lesson-agreements';
import type { User } from '@/types/users';

type SelectedLessonTypeSnapshot = { duration_minutes: number; frequency: LessonFrequency };

type AgreementProfile = Pick<User, 'first_name' | 'last_name' | 'avatar_url' | 'email'>;

export async function fetchAgreementProfiles(
	teacherUserId: string | undefined,
	studentUserId: string,
): Promise<Map<string, AgreementProfile>> {
	const [teacherProfile, studentProfile] = await Promise.all([
		teacherUserId
			? supabase
					.from('profiles')
					.select('first_name, last_name, email, avatar_url')
					.eq('user_id', teacherUserId)
					.single()
			: { data: null },
		supabase
			.from('profiles')
			.select('first_name, last_name, email, avatar_url')
			.eq('user_id', studentUserId)
			.single(),
	]);

	const profileMap = new Map<string, AgreementProfile>();
	if (teacherUserId && teacherProfile.data) {
		profileMap.set(teacherUserId, teacherProfile.data);
	}
	if (studentProfile.data) {
		profileMap.set(studentUserId, studentProfile.data);
	}
	return profileMap;
}

export function mapLoadedAgreementRow(
	data: RawAgreementRow,
	profileMap: Map<string, AgreementProfile>,
): AgreementTableRow {
	return mapRawAgreementToTableRow(data, profileMap);
}

export function getTeacherUserIdFromJoin(teachers: RawAgreementRow['teachers']): string | undefined {
	const teacher = Array.isArray(teachers) ? teachers[0] : teachers;
	return teacher?.user_id;
}

/** Used by useTeachers to skip loading on early wizard steps. */
export function shouldLoadTeachers(step: WizardStep, lessonTypeId: string | null): lessonTypeId is string {
	return step !== WizardStep.User && step !== WizardStep.Period && lessonTypeId !== null;
}

export function shouldLoadTeacherSlots(
	step: WizardStep,
	teacherUserId: string | null,
	lessonTypeId: string | null,
	startDate: string,
	endDate: string,
	selectedLessonType: SelectedLessonTypeSnapshot | undefined,
): selectedLessonType is SelectedLessonTypeSnapshot {
	return (
		step === WizardStep.TeacherSlot &&
		teacherUserId !== null &&
		lessonTypeId !== null &&
		startDate !== '' &&
		endDate !== '' &&
		selectedLessonType !== undefined
	);
}
