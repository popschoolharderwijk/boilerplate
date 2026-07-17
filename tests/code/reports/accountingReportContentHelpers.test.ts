import { describe, expect, it } from 'bun:test';
import {
	buildAccountingJournalLinesSummary,
	canDownloadAccountingReport,
	resolveAccountingReportCostCenterRows,
	resolveAccountingReportInvoiceCount,
	resolveAccountingReportSummary,
	resolveAccountingReportTableView,
	shouldRenderAccountingCostCenterTable,
	shouldRenderAccountingSummaryCards,
	shouldShowAccountingCostCenterTable,
} from '../../../src/lib/reports/accountingReportContentHelpers';

describe('shouldShowAccountingCostCenterTable', () => {
	it('returns true when cost center rows exist', () => {
		expect(shouldShowAccountingCostCenterTable(2)).toBe(true);
	});

	it('returns false when cost center rows are absent', () => {
		expect(shouldShowAccountingCostCenterTable(0)).toBe(false);
	});
});

describe('resolveAccountingReportTableView', () => {
	it('returns skeleton while loading', () => {
		expect(resolveAccountingReportTableView(true)).toBe('skeleton');
	});

	it('returns table when loading finished', () => {
		expect(resolveAccountingReportTableView(false)).toBe('table');
	});
});

describe('buildAccountingJournalLinesSummary', () => {
	it('builds the journal lines summary text', () => {
		expect(buildAccountingJournalLinesSummary(12, 4)).toBe('12 journaalregels uit 4 facturen');
	});
});

describe('canDownloadAccountingReport', () => {
	it('returns true when journal lines exist', () => {
		expect(canDownloadAccountingReport(3)).toBe(true);
	});

	it('returns false when journal lines are empty', () => {
		expect(canDownloadAccountingReport(0)).toBe(false);
	});
});

describe('resolveAccountingReportInvoiceCount', () => {
	it('returns zero when invoice count is missing', () => {
		expect(resolveAccountingReportInvoiceCount(undefined)).toBe(0);
	});

	it('returns provided invoice count', () => {
		expect(resolveAccountingReportInvoiceCount(4)).toBe(4);
	});
});

describe('shouldRenderAccountingSummaryCards', () => {
	it('returns true when summary exists', () => {
		expect(shouldRenderAccountingSummaryCards({ total_cents: 100 })).toBe(true);
	});

	it('returns false when summary is missing', () => {
		expect(shouldRenderAccountingSummaryCards(null)).toBe(false);
	});
});

describe('shouldRenderAccountingCostCenterTable', () => {
	it('returns true when report has cost center rows', () => {
		expect(shouldRenderAccountingCostCenterTable({ by_cost_center: [{ id: 'cc-1' }] })).toBe(true);
	});

	it('returns false when report is missing', () => {
		expect(shouldRenderAccountingCostCenterTable(null)).toBe(false);
	});
});

describe('resolveAccountingReportSummary', () => {
	it('returns summary when present', () => {
		expect(resolveAccountingReportSummary({ total_cents: 100 })).toEqual({ total_cents: 100 });
	});

	it('returns null when summary is missing', () => {
		expect(resolveAccountingReportSummary(null)).toBeNull();
	});
});

describe('resolveAccountingReportCostCenterRows', () => {
	it('returns rows when report has cost centers', () => {
		const row = {
			cost_center: 'Piano',
			invoice_count: 1,
			omzet_under_21_cents: 100,
			omzet_21_plus_excl_cents: 200,
			btw_cents: 42,
			total_debiteuren_cents: 342,
		};
		expect(resolveAccountingReportCostCenterRows({ by_cost_center: [row] })).toEqual([row]);
	});

	it('returns null when report is missing', () => {
		expect(resolveAccountingReportCostCenterRows(null)).toBeNull();
	});
});
