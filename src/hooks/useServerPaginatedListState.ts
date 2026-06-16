import { useState } from 'react';
import { useServerTableState } from '@/hooks/useServerTableState';

interface UseServerPaginatedListStateOptions {
	storageKey: string;
	initialSortColumn?: string;
	initialSortDirection?: 'asc' | 'desc';
	initialRowsPerPage?: number;
	initialFilters?: Record<string, unknown>;
}

/** Shared loading/totalCount + server table state for paginated list pages. */
export function useServerPaginatedListState(options: UseServerPaginatedListStateOptions) {
	const [loading, setLoading] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
	const table = useServerTableState(options);

	return {
		loading,
		setLoading,
		totalCount,
		setTotalCount,
		...table,
	};
}
