import { describe, expect, it } from 'bun:test';
import { shouldLoadAccountingReport } from '../../../src/lib/accounting/accountingLoadHelpers';

describe('shouldLoadAccountingReport', () => {
	it('returns true when enabled and both dates are set', () => {
		expect(shouldLoadAccountingReport(true, '2026-01-01', '2026-01-31')).toBe(true);
	});

	it('returns false when disabled', () => {
		expect(shouldLoadAccountingReport(false, '2026-01-01', '2026-01-31')).toBe(false);
	});

	it('returns false when either date is empty', () => {
		expect(shouldLoadAccountingReport(true, '', '2026-01-31')).toBe(false);
		expect(shouldLoadAccountingReport(true, '2026-01-01', '')).toBe(false);
	});
});
