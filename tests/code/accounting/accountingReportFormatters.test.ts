import { describe, expect, it } from 'bun:test';
import {
	formatAccountingInvoiceDate,
	getAccountingAgeBadge,
	getAccountingStatusBadgeVariant,
} from '../../../src/lib/accounting/accountingReportFormatters';

describe('getAccountingAgeBadge', () => {
	it('returns configured badge for under 21', () => {
		expect(getAccountingAgeBadge('under_21')).toEqual({
			label: '<21 vrijgesteld',
			variant: 'secondary',
		});
	});

	it('returns configured badge for 21 plus', () => {
		expect(getAccountingAgeBadge('21_plus')).toEqual({
			label: '21+ BTW 21%',
			variant: 'outline',
		});
	});

	it('falls back to the raw category for unknown values', () => {
		expect(getAccountingAgeBadge('custom')).toEqual({
			label: 'custom',
			variant: 'default',
		});
	});
});

describe('formatAccountingInvoiceDate', () => {
	it('returns the date portion of an ISO timestamp', () => {
		expect(formatAccountingInvoiceDate('2026-07-15T00:00:00Z')).toBe('2026-07-15');
	});
});

describe('getAccountingStatusBadgeVariant', () => {
	it('uses secondary variant for paid invoices', () => {
		expect(getAccountingStatusBadgeVariant('paid')).toBe('secondary');
	});

	it('uses outline variant for other statuses', () => {
		expect(getAccountingStatusBadgeVariant('open')).toBe('outline');
	});
});
