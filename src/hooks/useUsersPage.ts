import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useServerPaginatedListState } from '@/hooks/useServerPaginatedListState';
import { useUsersPageController } from '@/hooks/useUsersPageController';
import type { AppRole } from '@/lib/roles';
import {
	buildUserFormDialogOpenChangeHandler,
	buildUsersDeleteDialogOpenChangeHandler,
	buildUsersPageRowActions,
	createUsersPageRoleFilterSetter,
	resolveUsersPageSelectedRole,
	shouldShowUsersPage,
} from '@/lib/users/usersPageShellHelpers';

export function useUsersPage() {
	const { user, isAdmin, isSiteAdmin, isLoading: authLoading } = useAuth();
	const pagination = useServerPaginatedListState({
		storageKey: 'users',
		initialSortColumn: 'created_at',
		initialSortDirection: 'desc',
		initialFilters: { selectedRole: null },
	});

	const selectedRole = resolveUsersPageSelectedRole(
		pagination.filters.selectedRole as AppRole | null | 'none' | undefined,
	);
	const hasAccess = shouldShowUsersPage(isAdmin, isSiteAdmin);
	const setSelectedRole = createUsersPageRoleFilterSetter(pagination.setFilters);

	const controller = useUsersPageController({
		hasAccess,
		authLoading,
		isSiteAdmin,
		currentUserId: user?.id,
		currentPage: pagination.currentPage,
		rowsPerPage: pagination.rowsPerPage,
		debouncedSearchQuery: pagination.debouncedSearchQuery,
		selectedRole,
		sortColumn: pagination.sortColumn,
		sortDirection: pagination.sortDirection,
		setLoading: pagination.setLoading,
		setTotalCount: pagination.setTotalCount,
		setSelectedRole,
	});

	const rowActions = useMemo(
		() =>
			buildUsersPageRowActions({
				isAdmin,
				isSiteAdmin,
				currentUserId: user?.id,
				onEdit: controller.handleEdit,
				onDelete: controller.handleDelete,
			}),
		[isAdmin, isSiteAdmin, user?.id, controller.handleEdit, controller.handleDelete],
	);

	return {
		hasAccess,
		isSiteAdmin,
		isAdmin,
		userId: user?.id,
		pagination,
		controller,
		rowActions,
		userFormDialogOpenChange: buildUserFormDialogOpenChangeHandler(
			controller.userFormDialog,
			controller.setUserFormDialog,
		),
		deleteDialogOpenChange: buildUsersDeleteDialogOpenChangeHandler(controller.setDeleteDialog),
	};
}
