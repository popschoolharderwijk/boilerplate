import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActiveLessonTypes } from '@/hooks/useActiveLessonTypes';
import { useAuth } from '@/hooks/useAuth';
import { useListPageTableState } from '@/hooks/useListPageTableState';
import { useStudentsPageController } from '@/hooks/useStudentsPageController';
import { applyInitialStudentsSearchParam } from '@/lib/students/studentsPageViewHelpers';

export function useStudentsPage() {
	const navigate = useNavigate();
	const { isAdmin, isSiteAdmin, isPrivileged, isLoading: authLoading } = useAuth();
	const hasAccess = isPrivileged;
	const { lessonTypes } = useActiveLessonTypes(hasAccess);
	const tableState = useListPageTableState({
		storageKey: 'students',
		initialSortColumn: 'student',
		initialSortDirection: 'asc',
		lessonTypes,
	});
	const [searchParams, setSearchParams] = useSearchParams();

	// biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
	useEffect(() => {
		const nextParams = applyInitialStudentsSearchParam(searchParams, tableState.handleSearchChange);
		if (nextParams) {
			setSearchParams(nextParams, { replace: true });
		}
	}, []);

	const controller = useStudentsPageController({
		authLoading,
		hasAccess,
		navigate,
		currentPage: tableState.currentPage,
		rowsPerPage: tableState.rowsPerPage,
		debouncedSearchQuery: tableState.debouncedSearchQuery,
		statusFilter: tableState.statusFilter,
		selectedLessonTypeId: tableState.selectedLessonTypeId,
		sortColumn: tableState.sortColumn,
		sortDirection: tableState.sortDirection,
		setLoading: tableState.setLoading,
		setTotalCount: tableState.setTotalCount,
	});

	return {
		authLoading,
		hasAccess,
		isPrivileged,
		isAdmin,
		isSiteAdmin,
		tableState,
		controller,
	};
}
