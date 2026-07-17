import type { ReportRow } from '@/types/reports';

export function resolveReportCategorySortValue(row: ReportRow): string {
	if (row.source_type === 'project') return (row.project_name ?? '').toLowerCase();
	return (row.lesson_type_name ?? '').toLowerCase();
}

export function resolveDuoPerspectiveTitle(perspective: NonNullable<ReportRow['duo_perspective']>): string {
	if (perspective === 'teacher_block') {
		return 'Duo: 1 lesblok per duo-paar, BTW gesplitst per leerling';
	}
	return 'Duo: 2 leerling-lessen per duo-paar';
}
export function shouldRenderReportLessonCategory(row: ReportRow): boolean {
	return row.source_type !== 'project' && Boolean(row.lesson_type_name);
}
