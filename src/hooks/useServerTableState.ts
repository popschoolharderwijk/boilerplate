import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';
import type { SortDirection } from '@/components/ui/data-table';
import { applyTableStateAction, type TableStateAction } from '@/hooks/serverTableStateHelpers';
import {
	useDebouncedTableSearch,
	usePersistTableState,
	useResetTablePageOnFilterChange,
} from '@/hooks/useServerTableStateEffects';
import {
	readStoredTableStateForKey,
	resolveInitialTableState,
	type UseServerTableStateOptions,
} from '@/hooks/useServerTableStateHelpers';

interface UseServerTableStateReturn {
	searchQuery: string;
	debouncedSearchQuery: string;
	handleSearchChange: (query: string) => void;
	currentPage: number;
	rowsPerPage: number;
	handlePageChange: (page: number) => void;
	handleRowsPerPageChange: (newRowsPerPage: number) => void;
	sortColumn: string | null;
	sortDirection: SortDirection;
	handleSortChange: (column: string | null, direction: SortDirection) => void;
	filters: Record<string, unknown>;
	setFilters: Dispatch<SetStateAction<Record<string, unknown>>>;
}

/**
 * Custom hook for managing server-side table state (pagination, sorting, search).
 */
export function useServerTableState(options: UseServerTableStateOptions = {}): UseServerTableStateReturn {
	const { searchDebounceMs = 300, storageKey } = options;
	const stored = readStoredTableStateForKey(storageKey);
	const initial = resolveInitialTableState(stored, options);

	const [searchQuery, setSearchQuery] = useState(initial.searchQuery);
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initial.searchQuery);
	const [currentPage, setCurrentPage] = useState(initial.currentPage);
	const [rowsPerPage, setRowsPerPage] = useState(initial.rowsPerPage);
	const [sortColumn, setSortColumn] = useState<string | null>(initial.sortColumn);
	const [sortDirection, setSortDirection] = useState<SortDirection>(initial.sortDirection);
	const [filters, setFilters] = useState<Record<string, unknown>>(initial.filters);

	useDebouncedTableSearch(searchQuery, searchDebounceMs, setDebouncedSearchQuery);

	const dispatchTableAction = useCallback((action: TableStateAction) => {
		applyTableStateAction(action, {
			setSearchQuery,
			setCurrentPage,
			setRowsPerPage,
			setSortColumn,
			setSortDirection,
		});
	}, []);

	const resetPage = useCallback(() => setCurrentPage(1), []);
	useResetTablePageOnFilterChange(debouncedSearchQuery, sortColumn, sortDirection, filters, resetPage);

	usePersistTableState(storageKey, sortColumn, sortDirection, currentPage, rowsPerPage, searchQuery, filters);

	return {
		searchQuery,
		debouncedSearchQuery,
		handleSearchChange: (query: string) => dispatchTableAction({ type: 'search', query }),
		currentPage,
		rowsPerPage,
		handlePageChange: (page: number) => dispatchTableAction({ type: 'page', page }),
		handleRowsPerPageChange: (newRowsPerPage: number) =>
			dispatchTableAction({ type: 'rowsPerPage', rowsPerPage: newRowsPerPage }),
		sortColumn,
		sortDirection,
		handleSortChange: (column: string | null, direction: SortDirection) =>
			dispatchTableAction({ type: 'sort', column, direction }),
		filters,
		setFilters,
	};
}
