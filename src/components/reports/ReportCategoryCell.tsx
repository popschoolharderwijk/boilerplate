import { resolveReportCategoryDisplay } from '@/lib/reports/reportCategoryDisplayHelpers';
import type { ReportRow } from '@/types/reports';
import { ReportCategoryDisplayView } from './ReportCategoryDisplayView';

export function ReportCategoryCell({ row }: { row: ReportRow }) {
	return <ReportCategoryDisplayView display={resolveReportCategoryDisplay(row)} />;
}
