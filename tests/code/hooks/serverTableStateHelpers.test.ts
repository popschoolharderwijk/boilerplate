import { describe, expect, it } from 'bun:test';
import {
	applyTableStateAction,
	hasTableStateChanged,
	mergeStoredFilters,
} from '../../../src/hooks/serverTableStateHelpers';
import { resolveInitialTableState } from '../../../src/hooks/useServerTableStateHelpers';

describe('mergeStoredFilters', () => {
	it('merges stored filters with initial filters', () => {
		expect(mergeStoredFilters({ status: 'active' }, { page: 1 })).toEqual({
			page: 1,
			status: 'active',
		});
	});

	it('returns initial filters when stored filters are invalid', () => {
		expect(mergeStoredFilters(null, { page: 1 })).toEqual({ page: 1 });
	});
});

describe('hasTableStateChanged', () => {
	it('detects search query changes', () => {
		expect(
			hasTableStateChanged(
				{ debouncedSearchQuery: 'jan', sortColumn: null, sortDirection: null, filtersString: '{}' },
				{ debouncedSearchQuery: 'piet', sortColumn: null, sortDirection: null, filtersString: '{}' },
			),
		).toBe(true);
	});
});

describe('applyTableStateAction', () => {
	it('resets page when rows per page changes', () => {
		let rowsPerPage = 20;
		let currentPage = 3;
		applyTableStateAction(
			{ type: 'rowsPerPage', rowsPerPage: 50 },
			{
				setSearchQuery: () => {},
				setCurrentPage: (page) => {
					currentPage = page;
				},
				setRowsPerPage: (value) => {
					rowsPerPage = value;
				},
				setSortColumn: () => {},
				setSortDirection: () => {},
			},
		);
		expect(rowsPerPage).toBe(50);
		expect(currentPage).toBe(1);
	});
});

describe('resolveInitialTableState', () => {
	it('uses stored values when present', () => {
		expect(
			resolveInitialTableState(
				{
					searchQuery: 'abc',
					currentPage: 2,
					rowsPerPage: 50,
					sortColumn: 'name',
					sortDirection: 'desc',
					filters: { status: 'active' },
				},
				{ initialSortColumn: 'email', initialRowsPerPage: 20, initialFilters: { page: 1 } },
			),
		).toEqual({
			searchQuery: 'abc',
			currentPage: 2,
			rowsPerPage: 50,
			sortColumn: 'name',
			sortDirection: 'desc',
			filters: { page: 1, status: 'active' },
		});
	});
});
