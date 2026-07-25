import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type RpcResult = { data: unknown; error: { message: string } | null };

let rpcResult: RpcResult = { data: { data: [], total_count: 0 }, error: null };
let lastRpcParams: Record<string, unknown> | null = null;

const supabaseMock = {
	rpc: (_name: string, params: Record<string, unknown>) => {
		lastRpcParams = params;
		return Promise.resolve(rpcResult);
	},
};

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: supabaseMock,
}));

describe('fetchTeachersPaginated', () => {
	let fetchTeachersPaginated: typeof import('../../../src/lib/teachers/teachersPageHelpers').fetchTeachersPaginated;

	beforeAll(async () => {
		({ fetchTeachersPaginated } = await import('../../../src/lib/teachers/teachersPageHelpers'));
	});

	beforeEach(() => {
		rpcResult = {
			data: {
				data: [
					{
						user_id: 'teacher-1',
						created_at: '2026-01-01T00:00:00Z',
						updated_at: '2026-01-01T00:00:00Z',
						created_by: null,
						updated_by: null,
						is_active: true,
						profile: {
							user_id: 'teacher-1',
							email: 'piet@example.com',
							first_name: 'Piet',
							last_name: 'Docent',
							avatar_url: null,
							phone_number: null,
						},
						lesson_types: [{ id: 'lt-1', name: 'Piano', icon: 'piano', color: '#000' }],
					},
				],
				total_count: 1,
			},
			error: null,
		};
		lastRpcParams = null;
	});

	it('maps paginated teacher rows from the RPC response', async () => {
		const result = await fetchTeachersPaginated({
			limit: 10,
			offset: 0,
			search: 'piet',
			status: 'active',
			lessonTypeId: 'lt-1',
			sortColumn: 'name',
			sortDirection: 'asc',
		});

		expect(lastRpcParams).toEqual({
			p_limit: 10,
			p_offset: 0,
			p_search: 'piet',
			p_status: 'active',
			p_lesson_type_id: 'lt-1',
			p_sort_column: 'name',
			p_sort_direction: 'asc',
		});
		expect(result.error).toBeNull();
		expect(result.totalCount).toBe(1);
		expect(result.teachers).toHaveLength(1);
		expect(result.teachers[0]?.user_id).toBe('teacher-1');
		expect(result.teachers[0]?.lesson_types).toHaveLength(1);
		expect(result.teachers[0]?.lesson_types[0]?.name).toBe('Piano');
	});

	it('returns an error message when the RPC fails', async () => {
		rpcResult = { data: null, error: { message: 'rpc failed' } };
		const result = await fetchTeachersPaginated({
			limit: 5,
			offset: 5,
			search: null,
			status: 'all',
			lessonTypeId: null,
			sortColumn: null,
			sortDirection: null,
		});

		expect(result).toEqual({
			teachers: [],
			totalCount: 0,
			error: 'rpc failed',
		});
	});
});
