import { useMemo, useState } from 'react';
import type { QuickFilterGroup } from '@/components/ui/data-table';
import { useServerTableState } from '@/hooks/useServerTableState';
import { type LessonType, useLessonTypeFilter, useStatusFilter } from '@/hooks/useTableFilters';

type ListPageStatusFilter = 'all' | 'active' | 'inactive';

interface UseListPageTableStateOptions {
	storageKey: string;
	initialSortColumn?: string;
	initialSortDirection?: 'asc' | 'desc';
	initialRowsPerPage?: number;
	lessonTypes: LessonType[];
}

export function useListPageTableState(options: UseListPageTableStateOptions) {
	const [loading, setLoading] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
	const table = useServerTableState({
		storageKey: options.storageKey,
		initialSortColumn: options.initialSortColumn,
		initialSortDirection: options.initialSortDirection,
		initialRowsPerPage: options.initialRowsPerPage,
		initialFilters: { statusFilter: 'all', selectedLessonTypeId: null },
	});

	const statusFilter = (table.filters.statusFilter as ListPageStatusFilter) ?? 'all';
	const selectedLessonTypeId = (table.filters.selectedLessonTypeId as string | null) ?? null;

	const statusFilterGroup = useStatusFilter(statusFilter, (v) =>
		table.setFilters((prev) => ({ ...prev, statusFilter: v })),
	);
	const lessonTypeFilterGroup = useLessonTypeFilter(options.lessonTypes, selectedLessonTypeId, (v) =>
		table.setFilters((prev) => ({ ...prev, selectedLessonTypeId: v })),
	);

	const quickFilterGroups: QuickFilterGroup[] = useMemo(() => {
		const groups: QuickFilterGroup[] = [statusFilterGroup];
		if (lessonTypeFilterGroup) {
			groups.push(lessonTypeFilterGroup);
		}
		return groups;
	}, [statusFilterGroup, lessonTypeFilterGroup]);

	return {
		loading,
		setLoading,
		totalCount,
		setTotalCount,
		...table,
		statusFilter,
		selectedLessonTypeId,
		quickFilterGroups,
	};
}
