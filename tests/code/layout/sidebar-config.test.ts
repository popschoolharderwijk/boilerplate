import { describe, expect, it } from 'bun:test';
import {
	adminHrefs,
	adminNavItems,
	adminOperationalNavItems,
	financeHrefs,
	financeNavItems,
	isPathInGroup,
} from '../../../src/components/layout/sidebar-config';

describe('sidebar nav item constants', () => {
	it('maps admin nav items to hrefs', () => {
		expect(adminHrefs).toEqual(
			adminNavItems.map((item) => item.href).concat(financeNavItems.map((item) => item.href)),
		);
	});

	it('maps finance nav items to hrefs', () => {
		expect(financeHrefs).toEqual(financeNavItems.map((item) => item.href));
	});

	it('includes operational admin routes', () => {
		expect(adminOperationalNavItems.map((item) => item.href)).toEqual([
			'/agreements',
			'/lesson-groups',
			'/aanmeldingen',
			'/trial-lessons',
		]);
	});
});

describe('isPathInGroup', () => {
	const hrefs = ['/users', '/lesson-types'];

	it('matches an exact href', () => {
		expect(isPathInGroup('/users', hrefs)).toBe(true);
	});

	it('matches nested paths under an href', () => {
		expect(isPathInGroup('/lesson-types/abc', hrefs)).toBe(true);
	});

	it('returns false for unrelated paths', () => {
		expect(isPathInGroup('/students', hrefs)).toBe(false);
	});
});
