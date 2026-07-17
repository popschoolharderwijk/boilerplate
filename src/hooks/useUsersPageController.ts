import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/lib/roles';
import { fetchUsersPage, runUserDelete } from '@/lib/users/usersPageControllerHelpers';
import { buildUsersColumns, buildUsersQuickFilterGroups, type UserWithRole } from '@/lib/users/usersPageHelpers';

interface UseUsersPageControllerParams {
	hasAccess: boolean;
	authLoading: boolean;
	isSiteAdmin: boolean;
	currentUserId: string | undefined;
	currentPage: number;
	rowsPerPage: number;
	debouncedSearchQuery: string;
	selectedRole: AppRole | null | 'none';
	sortColumn: string | null;
	sortDirection: 'asc' | 'desc' | null;
	setLoading: (loading: boolean) => void;
	setTotalCount: (count: number) => void;
	setSelectedRole: (value: AppRole | null | 'none') => void;
}

export function useUsersPageController(params: UseUsersPageControllerParams) {
	const [users, setUsers] = useState<UserWithRole[]>([]);
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserWithRole } | null>(null);
	const [userFormDialog, setUserFormDialog] = useState<{ open: boolean; user: UserWithRole | null }>({
		open: false,
		user: null,
	});

	const loadUsers = useCallback(
		() =>
			fetchUsersPage({
				hasAccess: params.hasAccess,
				currentPage: params.currentPage,
				rowsPerPage: params.rowsPerPage,
				debouncedSearchQuery: params.debouncedSearchQuery,
				selectedRole: params.selectedRole,
				sortColumn: params.sortColumn,
				sortDirection: params.sortDirection,
				supabase,
				setLoading: params.setLoading,
				setTotalCount: params.setTotalCount,
				setUsers,
			}),
		[params],
	);

	useEffect(() => {
		if (!params.authLoading) {
			void loadUsers();
		}
	}, [params.authLoading, loadUsers]);

	const quickFilterGroups = useMemo(
		() => buildUsersQuickFilterGroups(params.selectedRole, params.setSelectedRole),
		[params.selectedRole, params.setSelectedRole],
	);

	const columns = useMemo(() => buildUsersColumns(params.currentUserId), [params.currentUserId]);

	const handleEdit = useCallback((targetUser: UserWithRole) => {
		setUserFormDialog({ open: true, user: targetUser });
	}, []);

	const handleCreate = useCallback(() => {
		setUserFormDialog({ open: true, user: null });
	}, []);

	const handleDelete = useCallback((targetUser: UserWithRole) => {
		setDeleteDialog({ open: true, user: targetUser });
	}, []);

	const confirmDelete = useCallback(() => {
		if (!deleteDialog?.user) return Promise.resolve();
		return runUserDelete({
			user: deleteDialog.user,
			isSiteAdmin: params.isSiteAdmin,
			supabase,
			setDeleteDialog,
			loadUsers,
		});
	}, [deleteDialog, params.isSiteAdmin, loadUsers]);

	return {
		users,
		columns,
		quickFilterGroups,
		deleteDialog,
		setDeleteDialog,
		userFormDialog,
		setUserFormDialog,
		loadUsers,
		handleEdit,
		handleCreate,
		handleDelete,
		confirmDelete,
	};
}
