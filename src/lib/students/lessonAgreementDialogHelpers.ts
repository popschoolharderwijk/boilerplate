import type { LessonAgreementWithTeacher } from '@/types/lesson-agreements';

export interface AgreementBillingPreviewInput {
	id: string;
	student_user_id: string;
	lesson_type_id: string;
	frequency: LessonAgreementWithTeacher['frequency'];
	duration_minutes: number;
	day_of_week: number;
	start_date: string;
	end_date: string | null;
}

export type AgreementStatusVariant = 'default' | 'secondary';

export function buildAgreementBillingPreviewInput(
	agreement: LessonAgreementWithTeacher | null,
	studentUserId: string | undefined,
	lessonTypeId: string | undefined,
	isPrivileged: boolean,
): AgreementBillingPreviewInput | null {
	if (!agreement || !studentUserId || !lessonTypeId || !isPrivileged) return null;
	return {
		id: agreement.id,
		student_user_id: studentUserId,
		lesson_type_id: lessonTypeId,
		frequency: agreement.frequency,
		duration_minutes: agreement.duration_minutes,
		day_of_week: agreement.day_of_week,
		start_date: agreement.start_date,
		end_date: agreement.end_date,
	};
}

export function resolveAgreementStatusVariant(isActive: boolean): AgreementStatusVariant {
	return isActive ? 'default' : 'secondary';
}

export function resolveAgreementStatusLabel(isActive: boolean): string {
	return isActive ? 'Actief' : 'Inactief';
}

export function resolveAgreementDayLabel(dayOfWeek: number, dayNames: readonly string[]): string {
	return dayNames[dayOfWeek] ?? `Dag ${dayOfWeek}`;
}

export function resolveAgreementEndDateLabel(endDate: string | null): string {
	return endDate ? formatAgreementDate(endDate) : 'Geen einddatum';
}

export function shouldShowAgreementPreviewBlock(
	previewInput: AgreementBillingPreviewInput | null,
): previewInput is AgreementBillingPreviewInput {
	return previewInput !== null;
}

export function formatAgreementDate(date: string): string {
	return new Date(date).toLocaleDateString('nl-NL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

export function formatAgreementCents(cents: number): string {
	return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
