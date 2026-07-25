import { useEffect, useRef } from 'react';
import type { SortDirection } from '@/components/ui/data-table';
import { hasTableStateChanged, type TableStateSnapshot, writeStoredTableState } from '@/hooks/serverTableStateHelpers';

export function useDebouncedTableSearch(
	searchQuery: string,
	debounceMs: number,
	setDebouncedSearchQuery: (value: string) => void,
) {
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), debounceMs);
		return () => clearTimeout(timer);
	}, [searchQuery, debounceMs, setDebouncedSearchQuery]);
}

export function useResetTablePageOnFilterChange(
	debouncedSearchQuery: string,
	sortColumn: string | null,
	sortDirection: SortDirection,
	filters: Record<string, unknown>,
	onResetPage: () => void,
) {
	const prevStateRef = useRef<TableStateSnapshot>({
		debouncedSearchQuery,
		sortColumn,
		sortDirection,
		filtersString: JSON.stringify(filters),
	});

	useEffect(() => {
		const current: TableStateSnapshot = {
			debouncedSearchQuery,
			sortColumn,
			sortDirection,
			filtersString: JSON.stringify(filters),
		};

		if (hasTableStateChanged(prevStateRef.current, current)) {
			onResetPage();
			prevStateRef.current = current;
		}
	}, [debouncedSearchQuery, sortColumn, sortDirection, filters, onResetPage]);
}

export function usePersistTableState(
	storageKey: string | undefined,
	sortColumn: string | null,
	sortDirection: SortDirection,
	currentPage: number,
	rowsPerPage: number,
	searchQuery: string,
	filters: Record<string, unknown>,
) {
	useEffect(() => {
		if (!storageKey) return;
		writeStoredTableState(storageKey, {
			sortColumn,
			sortDirection,
			currentPage,
			rowsPerPage,
			searchQuery,
			filters,
		});
	}, [storageKey, sortColumn, sortDirection, currentPage, rowsPerPage, searchQuery, filters]);
}
