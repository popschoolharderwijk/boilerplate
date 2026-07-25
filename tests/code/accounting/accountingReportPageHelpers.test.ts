import { describe, expect, it } from 'bun:test';
import { resolveAccountingReportPageView } from '../../../src/lib/accounting/accountingReportPageHelpers';

describe('resolveAccountingReportPageView', () => {
	it('returns redirect when user lacks access', () => {
		expect(resolveAccountingReportPageView(false, false, false)).toBe('redirect');
	});

	it('returns loading while auth or settings load', () => {
		expect(resolveAccountingReportPageView(true, true, false)).toBe('loading');
		expect(resolveAccountingReportPageView(false, true, true)).toBe('loading');
	});

	it('returns content when access and loading are ready', () => {
		expect(resolveAccountingReportPageView(false, true, false)).toBe('content');
	});
});
