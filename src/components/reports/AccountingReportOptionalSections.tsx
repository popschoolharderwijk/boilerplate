import { AccountingReportCostCenterTable } from '@/components/reports/AccountingReportCostCenterTable';
import { AccountingReportSummaryCards } from '@/components/reports/AccountingReportSummaryCards';
import type { useAccountingReport } from '@/hooks/useAccounting';
import {
	resolveAccountingReportCostCenterRows,
	resolveAccountingReportSummary,
} from '@/lib/reports/accountingReportContentHelpers';

interface AccountingReportOptionalSectionsProps {
	summary: ReturnType<typeof useAccountingReport>['report'] extends infer Report
		? Report extends { summary: infer Summary }
			? Summary
			: undefined
		: undefined;
	report: ReturnType<typeof useAccountingReport>['report'];
}

export function AccountingReportOptionalSections({ summary, report }: AccountingReportOptionalSectionsProps) {
	const summaryData = resolveAccountingReportSummary(summary);
	const costCenterRows = resolveAccountingReportCostCenterRows(report);

	return (
		<>
			{summaryData && <AccountingReportSummaryCards summary={summaryData} />}
			{costCenterRows && <AccountingReportCostCenterTable rows={costCenterRows} />}
		</>
	);
}
