import { describe, expect, it } from 'bun:test';
import {
	applyFetchUsersPageOutcome,
	buildUsersPaginatedRpcParams,
	executeFetchUsersPage,
	executeUserDelete,
	resolveDeleteUserInvokeOutcome,
} from '../../../src/lib/users/usersPageControllerHelpers';

describe('buildUsersPaginatedRpcParams', () => {
	it('builds paginated RPC params with defaults', () => {
		expect(
			buildUsersPaginatedRpcParams({
				currentPage: 2,
				rowsPerPage: 25,
				debouncedSearchQuery: 'anna',
				selectedRole: 'staff',
				sortColumn: 'email',
				sortDirection: 'desc',
			}),
		).toEqual({
			p_limit: 25,
			p_offset: 25,
			p_search: 'anna',
			p_role: 'staff',
			p_sort_column: 'email',
			p_sort_direction: 'desc',
		});
	});

	it('maps null role filter to null RPC role', () => {
		expect(
			buildUsersPaginatedRpcParams({
				currentPage: 1,
				rowsPerPage: 10,
				debouncedSearchQuery: '',
				selectedRole: null,
				sortColumn: null,
				sortDirection: null,
			}).p_role,
		).toBeNull();
	});
});

describe('resolveDeleteUserInvokeOutcome', () => {
	it('returns invoke-error when invoke fails', () => {
		expect(resolveDeleteUserInvokeOutcome({ message: 'network' }, null)).toEqual({
			outcome: 'invoke-error',
			errorMessage: 'network',
		});
	});

	it('returns response-error when response contains error', () => {
		expect(resolveDeleteUserInvokeOutcome(null, { error: 'forbidden' })).toEqual({
			outcome: 'response-error',
			errorMessage: 'forbidden',
		});
	});

	it('returns success when no errors are present', () => {
		expect(resolveDeleteUserInvokeOutcome(null, {})).toEqual({
			outcome: 'success',
			errorMessage: null,
		});
	});
});

describe('executeFetchUsersPage', () => {
	it('skips loading when user has no access', async () => {
		const outcome = await executeFetchUsersPage({
			hasAccess: false,
			currentPage: 1,
			rowsPerPage: 10,
			debouncedSearchQuery: '',
			selectedRole: null,
			sortColumn: null,
			sortDirection: null,
			supabase: { rpc: async () => ({ data: null, error: null }) } as never,
		});
		expect(outcome).toEqual({ kind: 'skipped' });
	});

	it('returns users on success', async () => {
		const outcome = await executeFetchUsersPage({
			hasAccess: true,
			currentPage: 1,
			rowsPerPage: 10,
			debouncedSearchQuery: '',
			selectedRole: null,
			sortColumn: null,
			sortDirection: null,
			supabase: {
				rpc: async () => ({
					data: {
						data: [
							{
								user_id: 'user-1',
								email: 'anna@example.com',
								first_name: 'Anna',
								last_name: 'Bakker',
								phone_number: null,
								avatar_url: null,
								created_at: '2026-01-01T00:00:00Z',
								role: 'staff',
							},
						],
						total_count: 1,
					},
					error: null,
				}),
			} as never,
		});
		expect(outcome).toEqual({
			kind: 'success',
			totalCount: 1,
			users: [
				{
					user_id: 'user-1',
					email: 'anna@example.com',
					first_name: 'Anna',
					last_name: 'Bakker',
					phone_number: null,
					avatar_url: null,
					created_at: '2026-01-01T00:00:00Z',
					role: 'staff',
				},
			],
		});
	});

	it('returns error when rpc fails', async () => {
		const outcome = await executeFetchUsersPage({
			hasAccess: true,
			currentPage: 1,
			rowsPerPage: 10,
			debouncedSearchQuery: '',
			selectedRole: null,
			sortColumn: null,
			sortDirection: null,
			supabase: {
				rpc: async () => ({ data: null, error: { message: 'rpc failed' } }),
			} as never,
		});
		expect(outcome).toEqual({ kind: 'error' });
	});
});

describe('applyFetchUsersPageOutcome', () => {
	it('updates users and total count on success', () => {
		let users: { user_id: string }[] = [];
		let totalCount = 0;
		const shouldStopLoading = applyFetchUsersPageOutcome(
			{
				kind: 'success',
				users: [{ user_id: 'user-1' } as never],
				totalCount: 3,
			},
			(nextUsers) => {
				users = nextUsers;
			},
			(count) => {
				totalCount = count;
			},
		);
		expect(shouldStopLoading).toBe(true);
		expect(users).toHaveLength(1);
		expect(totalCount).toBe(3);
	});

	it('returns false when loading was skipped', () => {
		const shouldStopLoading = applyFetchUsersPageOutcome(
			{ kind: 'skipped' },
			() => {},
			() => {},
		);
		expect(shouldStopLoading).toBe(false);
	});
});

describe('executeUserDelete', () => {
	it('returns success when delete invoke succeeds', async () => {
		const outcome = await executeUserDelete({
			supabase: {
				functions: {
					invoke: async () => ({ data: {}, error: null }),
				},
			} as never,
			userId: 'user-1',
			isSiteAdmin: false,
		});
		expect(outcome).toEqual({ kind: 'success' });
	});

	it('returns invoke-error when invoke fails', async () => {
		const outcome = await executeUserDelete({
			supabase: {
				functions: {
					invoke: async () => ({ data: null, error: { message: 'network' } }),
				},
			} as never,
			userId: 'user-1',
			isSiteAdmin: false,
		});
		expect(outcome.kind).toBe('invoke-error');
	});

	it('returns response-error when response contains error', async () => {
		const outcome = await executeUserDelete({
			supabase: {
				functions: {
					invoke: async () => ({ data: { error: 'forbidden' }, error: null }),
				},
			} as never,
			userId: 'user-1',
			isSiteAdmin: false,
		});
		expect(outcome).toEqual({ kind: 'response-error', message: 'forbidden' });
	});
});
