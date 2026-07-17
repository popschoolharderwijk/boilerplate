import type { SortDirection } from '@/components/ui/data-table';

const STORAGE_PREFIX = 'table-state:';

export interface StoredTableState {
	sortColumn: string | null;
	sortDirection: SortDirection;
	currentPage: number;
	rowsPerPage: number;
	searchQuery: string;
	filters?: Record<string, unknown>;
}

export function readStoredTableState(storageKey: string): Partial<StoredTableState> | null {
	try {
		const raw = sessionStorage.getItem(STORAGE_PREFIX + storageKey);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<StoredTableState>;
	} catch {
		return null;
	}
}

export function writeStoredTableState(storageKey: string, state: StoredTableState): void {
	try {
		sessionStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(state));
	} catch {
		// ignore quota / private mode
	}
}

export function mergeStoredFilters(
	storedFilters: unknown,
	initialFilters: Record<string, unknown>,
): Record<string, unknown> {
	if (storedFilters && typeof storedFilters === 'object' && !Array.isArray(storedFilters)) {
		return { ...initialFilters, ...(storedFilters as Record<string, unknown>) };
	}
	return { ...initialFilters };
}

export interface TableStateSnapshot {
	debouncedSearchQuery: string;
	sortColumn: string | null;
	sortDirection: SortDirection;
	filtersString: string;
}

export function hasTableStateChanged(prev: TableStateSnapshot, current: TableStateSnapshot): boolean {
	return (
		prev.debouncedSearchQuery !== current.debouncedSearchQuery ||
		prev.sortColumn !== current.sortColumn ||
		prev.sortDirection !== current.sortDirection ||
		prev.filtersString !== current.filtersString
	);
}

export type TableStateAction =
	| { type: 'search'; query: string }
	| { type: 'page'; page: number }
	| { type: 'rowsPerPage'; rowsPerPage: number }
	| { type: 'sort'; column: string | null; direction: SortDirection };

export interface TableStateSetters {
	setSearchQuery: (query: string) => void;
	setCurrentPage: (page: number) => void;
	setRowsPerPage: (rowsPerPage: number) => void;
	setSortColumn: (column: string | null) => void;
	setSortDirection: (direction: SortDirection) => void;
}

export function applyTableStateAction(action: TableStateAction, setters: TableStateSetters): void {
	switch (action.type) {
		case 'search':
			setters.setSearchQuery(action.query);
			break;
		case 'page':
			setters.setCurrentPage(action.page);
			break;
		case 'rowsPerPage':
			setters.setRowsPerPage(action.rowsPerPage);
			setters.setCurrentPage(1);
			break;
		case 'sort':
			setters.setSortColumn(action.column);
			setters.setSortDirection(action.direction);
			break;
	}
}
