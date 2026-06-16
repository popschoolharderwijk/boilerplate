import { useMemo, useState } from 'react';
import { LuFileSpreadsheet, LuFileText, LuSettings } from 'react-icons/lu';
import { Link, Navigate } from 'react-router-dom';
import { PeriodPresetControls } from '@/components/reports/PeriodPresetControls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { NAV_ICONS, NAV_LABELS } from '@/config/nav-labels';
import { useAccountingReport, useAccountingSettings } from '@/hooks/useAccounting';
import { useAuth } from '@/hooks/useAuth';
import { downloadFile } from '@/lib/accounting/download';
import { generateCsv, generateExactXml, generateJournalLines } from '@/lib/accounting/exporters';
import type { AccountingInvoice } from '@/lib/accounting/types';
import { formatCentsEUR } from '@/lib/accounting/types';
import { ACCOUNTING_PRESET_LABELS, type ExtendedPeriodPreset, getPresetDateRange } from '@/lib/reports/periodPresets';

const ACCOUNTING_PRESETS = Object.keys(ACCOUNTING_PRESET_LABELS) as ExtendedPeriodPreset[];

const AGE_BADGE: Record<string, { label: string; variant: 'secondary' | 'outline' | 'default' }> = {
	under_21: { label: '<21 vrijgesteld', variant: 'secondary' },
	'21_plus': { label: '21+ BTW 21%', variant: 'outline' },
	unknown: { label: 'Onbekende leeftijd', variant: 'default' },
};

export default function AccountingReportPage() {
	const { isAdmin, isSiteAdmin, isLoading: authLoading } = useAuth();
	const hasAccess = isAdmin || isSiteAdmin;

	const { settings, loading: settingsLoading } = useAccountingSettings();
	const schoolStartMonth = settings?.school_year_start_month ?? 8;

	const [preset, setPreset] = useState<ExtendedPeriodPreset>('this_month');
	const initial = getPresetDateRange('this_month', { schoolStartMonth });
	const [startDate, setStartDate] = useState(initial.start);
	const [endDate, setEndDate] = useState(initial.end);

	const { report, loading } = useAccountingReport(startDate, endDate, hasAccess);

	const handlePreset = (p: ExtendedPeriodPreset) => {
		setPreset(p);
		if (p !== 'custom') {
			const d = getPresetDateRange(p, { schoolStartMonth });
			setStartDate(d.start);
			setEndDate(d.end);
		}
	};

	const journalLines = useMemo(() => {
		if (!report || !settings) return [];
		return generateJournalLines(report, settings);
	}, [report, settings]);

	const handleCsv = () => {
		if (!journalLines.length) return;
		downloadFile(`boekhouding_${startDate}_${endDate}.csv`, generateCsv(journalLines), 'text/csv');
	};
	const handleXml = () => {
		if (!journalLines.length || !settings) return;
		downloadFile(
			`boekhouding_exact_${startDate}_${endDate}.xml`,
			generateExactXml(journalLines, settings),
			'application/xml',
		);
	};

	const invoiceColumns: DataTableColumn<AccountingInvoice>[] = useMemo(
		() => [
			{
				key: 'period_start',
				label: 'Factuurdatum',
				sortable: true,
				sortValue: (r) => r.period_start,
				render: (r) => <span className="tabular-nums">{r.period_start.slice(0, 10)}</span>,
			},
			{
				key: 'student_name',
				label: 'Leerling',
				sortable: true,
				sortValue: (r) => r.student_name.toLowerCase(),
				render: (r) => r.student_name,
			},
			{
				key: 'cost_center',
				label: 'Kostenplaats',
				sortable: true,
				sortValue: (r) => r.cost_center.toLowerCase(),
				render: (r) => <Badge variant="outline">{r.cost_center}</Badge>,
			},
			{
				key: 'age_category',
				label: 'BTW',
				sortable: true,
				sortValue: (r) => r.age_category,
				render: (r) => (
					<Badge variant={AGE_BADGE[r.age_category]?.variant ?? 'default'}>
						{AGE_BADGE[r.age_category]?.label ?? r.age_category}
					</Badge>
				),
			},
			{
				key: 'amount_excl_btw_cents',
				label: 'Excl. BTW',
				sortable: true,
				sortValue: (r) => r.amount_excl_btw_cents,
				className: 'text-right tabular-nums',
				render: (r) => <span className="tabular-nums">{formatCentsEUR(r.amount_excl_btw_cents)}</span>,
			},
			{
				key: 'btw_amount_cents',
				label: 'BTW',
				sortable: true,
				sortValue: (r) => r.btw_amount_cents,
				className: 'text-right tabular-nums',
				render: (r) => <span className="tabular-nums">{formatCentsEUR(r.btw_amount_cents)}</span>,
			},
			{
				key: 'amount_due_cents',
				label: 'Bruto',
				sortable: true,
				sortValue: (r) => r.amount_due_cents,
				className: 'text-right tabular-nums',
				render: (r) => <span className="font-medium tabular-nums">{formatCentsEUR(r.amount_due_cents)}</span>,
			},
			{
				key: 'status',
				label: 'Status',
				sortable: true,
				sortValue: (r) => r.status,
				render: (r) => <Badge variant={r.status === 'paid' ? 'secondary' : 'outline'}>{r.status}</Badge>,
			},
		],
		[],
	);

	if (!authLoading && !hasAccess) {
		return <Navigate to="/" replace />;
	}
	if (authLoading || settingsLoading) {
		return <PageSkeleton variant="header-and-cards" />;
	}

	const s = report?.summary;

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<PageHeader
					title={NAV_LABELS.accounting}
					subtitle="Journaalposten voor Exact Online op basis van Stripe-facturen"
				/>
				<Button asChild variant="outline" size="sm">
					<Link to="/boekhouding/instellingen">
						<LuSettings className="mr-2 h-4 w-4" />
						Instellingen
					</Link>
				</Button>
			</div>

			<PeriodPresetControls
				preset={preset}
				presets={ACCOUNTING_PRESETS}
				labels={ACCOUNTING_PRESET_LABELS}
				onPresetChange={handlePreset}
				startDate={startDate}
				endDate={endDate}
				onStartDateChange={setStartDate}
				onEndDateChange={setEndDate}
			/>

			<div className="flex flex-wrap gap-2">
				<Button onClick={handleCsv} disabled={!journalLines.length}>
					<LuFileSpreadsheet className="h-4 w-4 mr-2" />
					Download CSV
				</Button>
				<Button onClick={handleXml} disabled={!journalLines.length} variant="outline">
					<LuFileText className="h-4 w-4 mr-2" />
					Download Exact XML
				</Button>
				<span className="text-sm text-muted-foreground self-center">
					{journalLines.length} journaalregels uit {report?.invoices.length ?? 0} facturen
				</span>
			</div>

			{s && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Omzet &lt;21 (vrijgesteld)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tabular-nums">
								{formatCentsEUR(s.total_omzet_under_21_cents)}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Omzet 21+ (excl. BTW)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tabular-nums">
								{formatCentsEUR(s.total_omzet_21_plus_excl_cents)}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">BTW 21%</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tabular-nums">{formatCentsEUR(s.total_btw_cents)}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">Betaald (bank)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tabular-nums">{formatCentsEUR(s.total_paid_cents)}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">Openstaand</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tabular-nums">{formatCentsEUR(s.total_open_cents)}</div>
						</CardContent>
					</Card>
				</div>
			)}

			{report && report.by_cost_center.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<NAV_ICONS.accounting className="h-4 w-4" /> Uitsplitsing per kostenplaats
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="py-2">Kostenplaats</th>
										<th className="py-2 text-right">Facturen</th>
										<th className="py-2 text-right">Omzet &lt;21</th>
										<th className="py-2 text-right">Omzet 21+ excl</th>
										<th className="py-2 text-right">BTW</th>
										<th className="py-2 text-right">Totaal bruto</th>
									</tr>
								</thead>
								<tbody>
									{report.by_cost_center.map((c) => (
										<tr key={c.cost_center} className="border-b last:border-0">
											<td className="py-2">
												<Badge variant="outline">{c.cost_center}</Badge>
											</td>
											<td className="py-2 text-right tabular-nums">{c.invoice_count}</td>
											<td className="py-2 text-right tabular-nums">
												{formatCentsEUR(c.omzet_under_21_cents)}
											</td>
											<td className="py-2 text-right tabular-nums">
												{formatCentsEUR(c.omzet_21_plus_excl_cents)}
											</td>
											<td className="py-2 text-right tabular-nums">
												{formatCentsEUR(c.btw_cents)}
											</td>
											<td className="py-2 text-right tabular-nums font-medium">
												{formatCentsEUR(c.total_debiteuren_cents)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			{loading ? (
				<PageSkeleton variant="header-and-cards" />
			) : (
				<DataTable
					title="Facturen in periode"
					data={report?.invoices ?? []}
					columns={invoiceColumns}
					searchPlaceholder="Zoeken op leerling, kostenplaats..."
					searchFields={[(r) => r.student_name, (r) => r.cost_center, (r) => r.stripe_invoice_id]}
					getRowKey={(r) => r.invoice_id}
					emptyMessage="Geen facturen gevonden voor deze periode."
					initialSortColumn="period_start"
					initialSortDirection="asc"
					rowsPerPage={25}
					paginated
				/>
			)}
		</div>
	);
}
