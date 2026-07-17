import { DataTable } from '@/components/ui/data-table';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import type { useAccountingReportPage } from '@/hooks/useAccountingReportPage';
import type { AccountingReportTableView } from '@/lib/reports/accountingReportContentHelpers';

type AccountingReportPageState = ReturnType<typeof useAccountingReportPage>;

interface AccountingReportInvoiceTableSectionProps {
	tableView: AccountingReportTableView;
	state: AccountingReportPageState;
}

export function AccountingReportInvoiceTableSection({ tableView, state }: AccountingReportInvoiceTableSectionProps) {
	if (tableView === 'skeleton') {
		return <PageSkeleton variant="header-and-cards" />;
	}

	return (
		<DataTable
			title="Facturen in periode"
			data={state.report?.invoices ?? []}
			columns={state.invoiceColumns}
			searchPlaceholder="Zoeken op leerling, kostenplaats..."
			searchFields={[(row) => row.student_name, (row) => row.cost_center, (row) => row.stripe_invoice_id]}
			getRowKey={(row) => row.invoice_id}
			emptyMessage="Geen facturen gevonden voor deze periode."
			initialSortColumn="period_start"
			initialSortDirection="asc"
			rowsPerPage={25}
			paginated
		/>
	);
}
