import type { AccountingCostCenter } from '@/lib/accounting/types';

export type AccountingReportTableView = 'skeleton' | 'table';

export function resolveAccountingReportInvoiceCount(invoiceCount: number | undefined): number {
	return invoiceCount ?? 0;
}

export function shouldRenderAccountingSummaryCards(summary: unknown): boolean {
	return summary != null;
}

export function shouldShowAccountingCostCenterTable(byCostCenterLength: number | undefined): boolean {
	return (byCostCenterLength ?? 0) > 0;
}

export function shouldRenderAccountingCostCenterTable(
	report: { by_cost_center: unknown[] } | null | undefined,
): boolean {
	return report != null && shouldShowAccountingCostCenterTable(report.by_cost_center.length);
}

export function resolveAccountingReportTableView(loading: boolean): AccountingReportTableView {
	return loading ? 'skeleton' : 'table';
}

export function buildAccountingJournalLinesSummary(journalLinesCount: number, invoiceCount: number): string {
	return `${journalLinesCount} journaalregels uit ${invoiceCount} facturen`;
}

export function canDownloadAccountingReport(journalLinesCount: number): boolean {
	return journalLinesCount > 0;
}

export function resolveAccountingReportSummary<T>(summary: T | null | undefined): T | null {
	return shouldRenderAccountingSummaryCards(summary) ? (summary as T) : null;
}

export function resolveAccountingReportCostCenterRows(
	report: { by_cost_center: AccountingCostCenter[] } | null | undefined,
): AccountingCostCenter[] | null {
	if (!shouldRenderAccountingCostCenterTable(report) || !report) {
		return null;
	}
	return report.by_cost_center;
}
