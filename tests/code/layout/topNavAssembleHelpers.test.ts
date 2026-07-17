import { describe, expect, it } from 'bun:test';
import { resolveTopNavBreadcrumbItems } from '../../../src/lib/layout/topNavAssembleHelpers';

describe('resolveTopNavBreadcrumbItems', () => {
	it('combines base breadcrumb with suffix items', () => {
		const result = resolveTopNavBreadcrumbItems('/students', [{ label: 'Anna Bakker' }], () => [
			{ label: 'Leerlingen', href: '/students' },
		]);
		expect(result).toEqual([{ label: 'Leerlingen', href: '/students' }, { label: 'Anna Bakker' }]);
	});

	it('returns only base items when suffix is empty', () => {
		const result = resolveTopNavBreadcrumbItems('/dashboard', [], () => [
			{ label: 'Dashboard', href: '/dashboard' },
		]);
		expect(result).toEqual([{ label: 'Dashboard', href: '/dashboard' }]);
	});
});
