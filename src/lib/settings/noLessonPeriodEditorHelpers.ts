export function resolveNoLessonPeriodEditorDialogTitle(editing: { name: string } | null): string {
	return editing ? 'Periode bewerken' : 'Nieuwe lesvrije periode';
}

export function shouldShowNoLessonPeriodEndDateError(startDate: string, endDate: string): boolean {
	return startDate.length > 0 && endDate.length > 0 && endDate < startDate;
}
