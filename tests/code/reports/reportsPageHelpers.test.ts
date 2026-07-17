import { describe, expect, it } from 'bun:test';
import {
	shouldRedirectReportsAccess,
	shouldShowReportsAuthSkeleton,
} from '../../../src/lib/reports/reportsPageHelpers';

describe('shouldRedirectReportsAccess', () => {
	it('returns true when auth is loaded and access is denied', () => {
		expect(shouldRedirectReportsAccess(false, false)).toBe(true);
	});

	it('returns false while auth is loading', () => {
		expect(shouldRedirectReportsAccess(true, false)).toBe(false);
	});
});

describe('shouldShowReportsAuthSkeleton', () => {
	it('returns true while auth is loading', () => {
		expect(shouldShowReportsAuthSkeleton(true)).toBe(true);
	});

	it('returns false when auth is loaded', () => {
		expect(shouldShowReportsAuthSkeleton(false)).toBe(false);
	});
});
