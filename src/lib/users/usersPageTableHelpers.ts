export function shouldShowUsersCreateButton(isAdmin: boolean, isSiteAdmin: boolean): boolean {
	return isAdmin || isSiteAdmin;
}

export function resolveUsersTableRowClassName(userId: string, currentUserId: string | undefined): string | undefined {
	return userId === currentUserId ? 'bg-primary/15 hover:bg-primary/20' : undefined;
}

export function resolveUsersTableInitialSortColumn(sortColumn: string | null): string | undefined {
	return sortColumn || undefined;
}

export function resolveUsersTableInitialSortDirection(
	sortDirection: 'asc' | 'desc' | null,
): 'asc' | 'desc' | undefined {
	return sortDirection || undefined;
}
