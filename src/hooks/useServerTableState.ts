import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SortDirection } from '@/components/ui/data-table';

const STORAGE_PREFIX = 'table-state:';

interface StoredTableState {
	sortColumn: string | null;
	sortDirection: SortDirection;
	currentPage: number;
	rowsPerPage: number;
	searchQuery: string;
	filters?: Record<string, unknown>;
}

function readStoredState(storageKey: string): Partial<StoredTableState> | null {
	try {
		const raw = sessionStorage.getItem(STORAGE_PREFIX + storageKey);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<StoredTableState>;
	} catch {
		return null;
	}
}

function writeStoredState(storageKey: string, state: StoredTableState): void {
	try {
		sessionStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(state));
	} catch {
		// ignore quota / private mode
	}
}

interface UseServerTableStateOptions {
	initialSortColumn?: string;
	initialSortDirection?: SortDirection;
	searchDebounceMs?: number;
	initialRowsPerPage?: number;
	storageKey?: string;
	initialFilters?: Record<string, unknown>;
}

type TableStateAction =
	| { type: 'search'; query: string }
	| { type: 'page'; page: number }
	| { type: 'rowsPerPage'; rowsPerPage: number }
	| { type: 'sort'; column: string | null; direction: SortDirection };

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
	const {
		initialSortColumn,
		initialSortDirection = 'asc',
		searchDebounceMs = 300,
		initialRowsPerPage = 20,
		storageKey,
		initialFilters = {},
	} = options;

	const storedRef = useRef(storageKey ? readStoredState(storageKey) : null);
	const stored = storedRef.current;

	const [searchQuery, setSearchQuery] = useState(stored?.searchQuery ?? '');
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(stored?.searchQuery ?? '');
	const [currentPage, setCurrentPage] = useState(stored?.currentPage ?? 1);
	const [rowsPerPage, setRowsPerPage] = useState(stored?.rowsPerPage ?? initialRowsPerPage);
	const [sortColumn, setSortColumn] = useState<string | null>(stored?.sortColumn ?? initialSortColumn ?? null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(
		stored?.sortDirection ?? (initialSortColumn ? initialSortDirection : null),
	);
	const [filters, setFilters] = useState<Record<string, unknown>>(() => {
		const storedFilters = stored?.filters;
		if (storedFilters && typeof storedFilters === 'object' && !Array.isArray(storedFilters)) {
			return { ...initialFilters, ...storedFilters };
		}
		return { ...initialFilters };
	});

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
		}, searchDebounceMs);
		return () => clearTimeout(timer);
	}, [searchQuery, searchDebounceMs]);

	const dispatchTableAction = useCallback((action: TableStateAction) => {
		switch (action.type) {
			case 'search':
				setSearchQuery(action.query);
				break;
			case 'page':
				setCurrentPage(action.page);
				break;
			case 'rowsPerPage':
				setRowsPerPage(action.rowsPerPage);
				setCurrentPage(1);
				break;
			case 'sort':
				setSortColumn(action.column);
				setSortDirection(action.direction);
				break;
		}
	}, []);

	const prevStateRef = useRef({
		debouncedSearchQuery,
		sortColumn,
		sortDirection,
		filtersString: JSON.stringify(filters),
	});

	useEffect(() => {
		const prev = prevStateRef.current;
		const currentFiltersString = JSON.stringify(filters);
		const hasChanged =
			prev.debouncedSearchQuery !== debouncedSearchQuery ||
			prev.sortColumn !== sortColumn ||
			prev.sortDirection !== sortDirection ||
			prev.filtersString !== currentFiltersString;

		if (hasChanged) {
			setCurrentPage(1);
			prevStateRef.current = {
				debouncedSearchQuery,
				sortColumn,
				sortDirection,
				filtersString: currentFiltersString,
			};
		}
	}, [debouncedSearchQuery, sortColumn, sortDirection, filters]);

	useEffect(() => {
		if (!storageKey) return;
		writeStoredState(storageKey, {
			sortColumn,
			sortDirection,
			currentPage,
			rowsPerPage,
			searchQuery,
			filters,
		});
	}, [storageKey, sortColumn, sortDirection, currentPage, rowsPerPage, searchQuery, filters]);

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
