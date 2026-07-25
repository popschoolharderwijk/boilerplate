import type { EnrichedTrialLessonStaff } from '@/lib/trial-lessons/enrichTrialLessons';

export type TrialLessonStaffStatus = EnrichedTrialLessonStaff['status'];

export type TrialStatusBadgeVariant = 'default' | 'outline' | 'secondary';

export function getTrialStatusBadgeVariant(status: TrialLessonStaffStatus): TrialStatusBadgeVariant {
	if (status === 'student_confirmed') {
		return 'default';
	}
	if (status === 'student_declined' || status === 'cancelled') {
		return 'outline';
	}
	return 'secondary';
}

export interface TrialLessonConvertParams {
	fromTrial: string;
	studentUserId: string;
	lessonTypeId: string;
	optionId?: string | null;
}

export function buildTrialLessonConvertParams(row: EnrichedTrialLessonStaff): TrialLessonConvertParams {
	return {
		fromTrial: row.id,
		studentUserId: row.student_user_id,
		lessonTypeId: row.lesson_type_id,
		optionId: row.lesson_type_option_id,
	};
}

export function buildTrialLessonConvertSearchParams(params: TrialLessonConvertParams): URLSearchParams {
	const searchParams = new URLSearchParams({
		fromTrial: params.fromTrial,
		studentUserId: params.studentUserId,
		lessonTypeId: params.lessonTypeId,
	});
	if (params.optionId) {
		searchParams.set('optionId', params.optionId);
	}
	return searchParams;
}

export function showTrialGivenButton(status: TrialLessonStaffStatus): boolean {
	return status === 'scheduled';
}

export function showTrialAgreementButton(status: TrialLessonStaffStatus): boolean {
	return status === 'student_confirmed';
}

export function showTrialCancelButton(status: TrialLessonStaffStatus): boolean {
	return status === 'scheduled' || status === 'completed';
}
