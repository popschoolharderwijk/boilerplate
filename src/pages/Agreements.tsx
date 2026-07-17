import { Navigate, useNavigate } from 'react-router-dom';
import { AgreementsPageDialogs } from '@/components/agreements/AgreementsPageDialogs';
import { AgreementsPageTable } from '@/components/agreements/AgreementsPageTable';
import { useActiveLessonTypes } from '@/hooks/useActiveLessonTypes';
import { useAgreementsPageController } from '@/hooks/useAgreementsPageController';
import { useAuth } from '@/hooks/useAuth';
import { useListPageTableState } from '@/hooks/useListPageTableState';
import { shouldShowAgreementsPage } from '@/lib/agreements/agreementsPageShellHelpers';

export default function Agreements() {
	const navigate = useNavigate();
	const { isPrivileged, isLoading: authLoading } = useAuth();
	const hasAccess = shouldShowAgreementsPage(isPrivileged);
	const { lessonTypes } = useActiveLessonTypes(hasAccess);
	const tableState = useListPageTableState({
		storageKey: 'agreements',
		initialSortColumn: 'created_at',
		initialSortDirection: 'desc',
		lessonTypes,
	});

	const { agreements, deleteDialog, setDeleteDialog, runAction } = useAgreementsPageController({
		authLoading,
		hasAccess,
		navigate,
		statusFilter: tableState.statusFilter,
		selectedLessonTypeId: tableState.selectedLessonTypeId,
		debouncedSearchQuery: tableState.debouncedSearchQuery,
		sortColumn: tableState.sortColumn,
		sortDirection: tableState.sortDirection,
		currentPage: tableState.currentPage,
		rowsPerPage: tableState.rowsPerPage,
		setLoading: tableState.setLoading,
		setTotalCount: tableState.setTotalCount,
	});

	if (!authLoading && !hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<div>
			<AgreementsPageTable
				navigate={navigate}
				agreements={agreements}
				searchQuery={tableState.searchQuery}
				onSearchChange={tableState.handleSearchChange}
				loading={tableState.loading}
				totalCount={tableState.totalCount}
				currentPage={tableState.currentPage}
				rowsPerPage={tableState.rowsPerPage}
				onPageChange={tableState.handlePageChange}
				onRowsPerPageChange={tableState.handleRowsPerPageChange}
				sortColumn={tableState.sortColumn}
				sortDirection={tableState.sortDirection}
				onSortChange={tableState.handleSortChange}
				quickFilterGroups={tableState.quickFilterGroups}
				runAction={runAction}
			/>

			<AgreementsPageDialogs
				deleteDialog={deleteDialog}
				setDeleteDialog={setDeleteDialog}
				onConfirmDelete={() => runAction({ kind: 'confirm-delete' })}
			/>
		</div>
	);
}
