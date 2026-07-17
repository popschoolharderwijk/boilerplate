import { describe, expect, it } from 'bun:test';
import { applyAccountingPresetChange } from '../../../src/lib/accounting/accountingReportHelpers';

describe('applyAccountingPresetChange', () => {
	it('returns null for the custom preset', () => {
		expect(applyAccountingPresetChange('custom', 8)).toBeNull();
	});

	it('returns preset date boundaries for this month', () => {
		expect(applyAccountingPresetChange('this_month', 8)).toEqual({
			startDate: '2026-07-01',
			endDate: '2026-07-31',
		});
	});

	it('returns school year boundaries for this_school_year', () => {
		expect(applyAccountingPresetChange('this_school_year', 8)).toEqual({
			startDate: '2025-08-01',
			endDate: '2026-07-31',
		});
	});
});
