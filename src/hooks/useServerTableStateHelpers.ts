import type { SortDirection } from '@/components/ui/data-table';
import { mergeStoredFilters, readStoredTableState, type StoredTableState } from '@/hooks/serverTableStateHelpers';

export interface UseServerTableStateOptions {
	searchDebounceMs?: number;
	initialSortColumn?: string;
	initialSortDirection?: SortDirection;
	initialRowsPerPage?: number;
	storageKey?: string;
	initialFilters?: Record<string, unknown>;
}

export interface ResolvedTableState {
	searchQuery: string;
	currentPage: number;
	rowsPerPage: number;
	sortColumn: string | null;
	sortDirection: SortDirection;
	filters: Record<string, unknown>;
}

export function resolveInitialTableState(
	stored: Partial<StoredTableState> | null,
	options: UseServerTableStateOptions,
): ResolvedTableState {
	const { initialSortColumn, initialSortDirection = 'asc', initialRowsPerPage = 20, initialFilters = {} } = options;

	return {
		searchQuery: stored?.searchQuery ?? '',
		currentPage: stored?.currentPage ?? 1,
		rowsPerPage: stored?.rowsPerPage ?? initialRowsPerPage,
		sortColumn: stored?.sortColumn ?? initialSortColumn ?? null,
		sortDirection: stored?.sortDirection ?? (initialSortColumn ? initialSortDirection : null),
		filters: mergeStoredFilters(stored?.filters, initialFilters),
	};
}

export function readStoredTableStateForKey(storageKey: string | undefined): Partial<StoredTableState> | null {
	if (!storageKey) return null;
	return readStoredTableState(storageKey);
}
