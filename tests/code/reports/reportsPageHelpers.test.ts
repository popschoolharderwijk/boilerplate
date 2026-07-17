import { describe, expect, it } from 'bun:test';
import { shouldRedirectReportsAccess } from '../../../src/lib/reports/reportsPageHelpers';

describe('shouldRedirectReportsAccess', () => {
	it('returns true when auth is loaded and access is denied', () => {
		expect(shouldRedirectReportsAccess(false, false)).toBe(true);
	});

	it('returns false while auth is loading', () => {
		expect(shouldRedirectReportsAccess(true, false)).toBe(false);
	});
});
