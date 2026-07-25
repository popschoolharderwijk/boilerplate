export type NoLessonPeriodDeleteOutcome = 'success' | 'error';

export function resolveNoLessonPeriodDeleteOutcome(
	error: unknown,
	deletedRows: { id: string }[] | null | undefined,
): NoLessonPeriodDeleteOutcome {
	if (error || !deletedRows?.length) return 'error';
	return 'success';
}

export function isNoLessonPeriodFormValid(name: string, startDate: string, endDate: string): boolean {
	return name.trim().length > 0 && startDate.length > 0 && endDate.length > 0 && endDate >= startDate;
}

export interface NoLessonPeriodPayload {
	name: string;
	start_date: string;
	end_date: string;
	description: string | null;
}

export interface NoLessonPeriodFormInput {
	name: string;
	start_date: string;
	end_date: string;
	description: string;
}

export function buildNoLessonPeriodPayload(form: NoLessonPeriodFormInput): NoLessonPeriodPayload {
	const trimmedDescription = form.description.trim();
	return {
		name: form.name.trim(),
		start_date: form.start_date,
		end_date: form.end_date,
		description: trimmedDescription.length > 0 ? trimmedDescription : null,
	};
}

export type NoLessonPeriodSaveMode = 'create' | 'update';

export function resolveNoLessonPeriodSaveErrorToast(mode: NoLessonPeriodSaveMode): string {
	return mode === 'update' ? 'Fout bij bijwerken lesvrije periode' : 'Fout bij aanmaken lesvrije periode';
}

export function resolveNoLessonPeriodSaveSuccessToast(mode: NoLessonPeriodSaveMode): string {
	return mode === 'update' ? 'Lesvrije periode bijgewerkt' : 'Lesvrije periode aangemaakt';
}
