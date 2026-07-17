import { resolveDuoPerspectiveTitle, shouldRenderReportLessonCategory } from '@/lib/reports/reportCategoryCellHelpers';
import type { ReportRow } from '@/types/reports';
import { DUO_PERSPECTIVE_LABELS } from '@/types/reports';

export type ReportProjectCategoryDisplay = {
	kind: 'project';
	projectName: string;
};

export type ReportLessonCategoryDisplay = {
	kind: 'lesson';
	lessonTypeName: string;
	lessonTypeIcon: string;
	lessonTypeColor: string;
	duoPerspective: ReportRow['duo_perspective'];
	duoPerspectiveLabel: string | null;
	duoPerspectiveTitle: string | null;
};

export type ReportCategoryDisplay = ReportProjectCategoryDisplay | ReportLessonCategoryDisplay | { kind: 'none' };

export function resolveReportCategoryDisplay(row: ReportRow): ReportCategoryDisplay {
	if (row.source_type === 'project') {
		return { kind: 'project', projectName: row.project_name ?? '' };
	}
	if (!shouldRenderReportLessonCategory(row)) {
		return { kind: 'none' };
	}
	const duoPerspective = row.duo_perspective ?? null;
	return {
		kind: 'lesson',
		lessonTypeName: row.lesson_type_name ?? '',
		lessonTypeIcon: row.lesson_type_icon ?? '',
		lessonTypeColor: row.lesson_type_color ?? '',
		duoPerspective,
		duoPerspectiveLabel: duoPerspective ? DUO_PERSPECTIVE_LABELS[duoPerspective] : null,
		duoPerspectiveTitle: duoPerspective ? resolveDuoPerspectiveTitle(duoPerspective) : null,
	};
}
