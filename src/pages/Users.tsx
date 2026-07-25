import { Navigate } from 'react-router-dom';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { UsersDeleteDialog } from '@/components/users/UsersPageParts';
import { UsersPageTable } from '@/components/users/UsersPageTable';
import { useUsersPage } from '@/hooks/useUsersPage';

export default function Users() {
	const page = useUsersPage();

	if (!page.hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<div>
			<UsersPageTable
				isSiteAdmin={page.isSiteAdmin}
				isAdmin={page.isAdmin}
				userId={page.userId}
				users={page.controller.users}
				columns={page.controller.columns}
				searchQuery={page.pagination.searchQuery}
				onSearchChange={page.pagination.handleSearchChange}
				loading={page.pagination.loading}
				totalCount={page.pagination.totalCount}
				currentPage={page.pagination.currentPage}
				rowsPerPage={page.pagination.rowsPerPage}
				onPageChange={page.pagination.handlePageChange}
				onRowsPerPageChange={page.pagination.handleRowsPerPageChange}
				sortColumn={page.pagination.sortColumn}
				sortDirection={page.pagination.sortDirection}
				onSortChange={page.pagination.handleSortChange}
				quickFilterGroups={page.controller.quickFilterGroups}
				rowActions={page.rowActions}
				onCreate={page.controller.handleCreate}
			/>

			<UserFormDialog
				open={page.controller.userFormDialog.open}
				onOpenChange={page.userFormDialogOpenChange}
				onSuccess={page.controller.loadUsers}
				user={page.controller.userFormDialog.user ?? undefined}
			/>

			<UsersDeleteDialog
				deleteDialog={page.controller.deleteDialog}
				onOpenChange={page.deleteDialogOpenChange}
				onConfirm={page.controller.confirmDelete}
			/>
		</div>
	);
}
