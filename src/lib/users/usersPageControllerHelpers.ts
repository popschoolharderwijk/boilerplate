import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { getInvokeErrorMessage } from '@/lib/auth/invokeError';
import { getDisplayName } from '@/lib/display-name';
import type { AppRole } from '@/lib/roles';
import { mapUsersSortColumn, parsePaginatedUsersResponse, type UserWithRole } from '@/lib/users/usersPageHelpers';

interface UsersPaginatedRpcParams {
	p_limit: number;
	p_offset: number;
	p_search: string | null;
	p_role: AppRole | 'none' | null;
	p_sort_column: string;
	p_sort_direction: 'asc' | 'desc';
}

function buildUsersPaginatedRpcParams(params: {
	currentPage: number;
	rowsPerPage: number;
	debouncedSearchQuery: string;
	selectedRole: AppRole | null | 'none';
	sortColumn: string | null;
	sortDirection: 'asc' | 'desc' | null;
}): UsersPaginatedRpcParams {
	return {
		p_limit: params.rowsPerPage,
		p_offset: (params.currentPage - 1) * params.rowsPerPage,
		p_search: params.debouncedSearchQuery || null,
		p_role: params.selectedRole === null ? null : params.selectedRole,
		p_sort_column: mapUsersSortColumn(params.sortColumn),
		p_sort_direction: params.sortDirection || 'asc',
	};
}

type DeleteUserInvokeOutcome = 'success' | 'invoke-error' | 'response-error';

function resolveDeleteUserInvokeOutcome(
	invokeError: { message?: string } | null,
	data: { error?: string } | null | undefined,
): { outcome: DeleteUserInvokeOutcome; errorMessage: string | null } {
	if (invokeError) {
		return { outcome: 'invoke-error', errorMessage: invokeError.message ?? null };
	}
	if (data?.error) {
		return { outcome: 'response-error', errorMessage: data.error };
	}
	return { outcome: 'success', errorMessage: null };
}

export interface FetchUsersPageParams {
	hasAccess: boolean;
	currentPage: number;
	rowsPerPage: number;
	debouncedSearchQuery: string;
	selectedRole: AppRole | null | 'none';
	sortColumn: string | null;
	sortDirection: 'asc' | 'desc' | null;
	supabase: SupabaseClient;
	setLoading: (loading: boolean) => void;
	setTotalCount: (count: number) => void;
	setUsers: (users: UserWithRole[]) => void;
}

type FetchUsersPageOutcome =
	| { kind: 'skipped' }
	| { kind: 'error' }
	| { kind: 'success'; users: UserWithRole[]; totalCount: number };

interface ExecuteFetchUsersPageParams {
	hasAccess: boolean;
	currentPage: number;
	rowsPerPage: number;
	debouncedSearchQuery: string;
	selectedRole: AppRole | null | 'none';
	sortColumn: string | null;
	sortDirection: 'asc' | 'desc' | null;
	supabase: SupabaseClient;
}

async function executeFetchUsersPage(params: ExecuteFetchUsersPageParams): Promise<FetchUsersPageOutcome> {
	if (!params.hasAccess) return { kind: 'skipped' };

	try {
		const { data, error } = await params.supabase.rpc('get_users_paginated', buildUsersPaginatedRpcParams(params));

		if (error) {
			console.error('Error loading users:', error);
			toast.error('Fout bij laden gebruikers');
			return { kind: 'error' };
		}

		const result = parsePaginatedUsersResponse(data);
		return {
			kind: 'success',
			users: result.data ?? [],
			totalCount: result.total_count ?? 0,
		};
	} catch (error) {
		console.error('Error loading users:', error);
		toast.error('Fout bij laden gebruikers');
		return { kind: 'error' };
	}
}

function applyFetchUsersPageOutcome(
	outcome: FetchUsersPageOutcome,
	setUsers: (users: UserWithRole[]) => void,
	setTotalCount: (count: number) => void,
): boolean {
	if (outcome.kind === 'success') {
		setUsers(outcome.users);
		setTotalCount(outcome.totalCount);
	}
	return outcome.kind !== 'skipped';
}

export async function fetchUsersPage(params: FetchUsersPageParams): Promise<void> {
	params.setLoading(true);
	const outcome = await executeFetchUsersPage(params);
	applyFetchUsersPageOutcome(outcome, params.setUsers, params.setTotalCount);
	if (outcome.kind !== 'skipped') {
		params.setLoading(false);
	}
}

export interface RunUserDeleteParams {
	user: UserWithRole;
	isSiteAdmin: boolean;
	supabase: SupabaseClient;
	setDeleteDialog: (value: null) => void;
	loadUsers: () => Promise<void>;
}

type ExecuteUserDeleteOutcome =
	| { kind: 'success' }
	| { kind: 'invoke-error'; message: string }
	| { kind: 'response-error'; message: string };

async function executeUserDelete(params: {
	supabase: SupabaseClient;
	userId: string;
	isSiteAdmin: boolean;
}): Promise<ExecuteUserDeleteOutcome> {
	const { data, error: invokeError } = await params.supabase.functions.invoke('delete-user', {
		body: { userId: params.userId },
	});

	const invokeOutcome = resolveDeleteUserInvokeOutcome(invokeError, data);
	if (invokeOutcome.outcome === 'invoke-error') {
		const errorMessage = await getInvokeErrorMessage(invokeError, { isSiteAdmin: params.isSiteAdmin });
		return { kind: 'invoke-error', message: errorMessage };
	}

	if (invokeOutcome.outcome === 'response-error') {
		return { kind: 'response-error', message: invokeOutcome.errorMessage ?? 'Delete failed' };
	}

	return { kind: 'success' };
}

export async function runUserDelete(params: RunUserDeleteParams): Promise<void> {
	try {
		const outcome = await executeUserDelete({
			supabase: params.supabase,
			userId: params.user.user_id,
			isSiteAdmin: params.isSiteAdmin,
		});

		if (outcome.kind === 'invoke-error') {
			toast.error('Fout bij verwijderen gebruiker', { description: outcome.message });
			throw new Error(outcome.message);
		}

		if (outcome.kind === 'response-error') {
			toast.error('Fout bij verwijderen gebruiker', { description: outcome.message });
			throw new Error(outcome.message);
		}

		toast.success('Gebruiker verwijderd', {
			description: `${getDisplayName(params.user)} is verwijderd.`,
		});

		params.setDeleteDialog(null);
		await params.loadUsers();
	} catch (error) {
		console.error('Error deleting user:', error);
		toast.error('Fout bij verwijderen gebruiker', {
			description: 'Er is een netwerkfout opgetreden. Probeer het later opnieuw.',
		});
		throw error;
	}
}
