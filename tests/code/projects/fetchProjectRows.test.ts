import { beforeAll, describe, expect, it } from 'bun:test';
import { fetchProjectRows } from '../../../src/lib/projects/projectsPageHelpers';

type TableResult = { data?: unknown; error?: { message: string } | null };

function createClientMock(results: Record<string, TableResult>) {
	return {
		from: (table: string) => {
			let operation = 'select';
			const builder = {
				select: (_cols?: string) => {
					operation = 'select';
					return builder;
				},
				order: () => builder,
				eq: () => builder,
				in: () => builder,
				delete: () => builder,
				// biome-ignore lint/suspicious/noThenProperty: supabase query builder mock
				then<TResult1 = TableResult, TResult2 = never>(
					onFulfilled?: ((value: TableResult) => TResult1 | PromiseLike<TResult1>) | null,
					onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
				) {
					return Promise.resolve(results[`${table}:${operation}`] ?? { data: [], error: null }).then(
						onFulfilled,
						onRejected,
					);
				},
			};
			return builder;
		},
	};
}

const rawProject = {
	id: 'proj-1',
	name: 'Project A',
	description: 'Desc',
	cost_center: 'KP-1',
	is_active: true,
	owner_user_id: 'owner-1',
	label_id: 'label-1',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-02T00:00:00Z',
	created_by: null,
	updated_by: null,
};

describe('fetchProjectRows', () => {
	let fetchFn: typeof fetchProjectRows;

	beforeAll(async () => {
		fetchFn = fetchProjectRows;
	});

	it('returns error message when project query fails', async () => {
		const client = createClientMock({
			'projects:select': { data: null, error: { message: 'db error' } },
		});
		const result = await fetchFn(client as never);
		expect(result).toEqual({ projects: [], error: 'db error' });
	});

	it('returns empty projects when no rows exist', async () => {
		const client = createClientMock({
			'projects:select': { data: [], error: null },
		});
		const result = await fetchFn(client as never);
		expect(result).toEqual({ projects: [], error: null });
	});

	it('maps joined project rows with slot counts and owner profile', async () => {
		const client = createClientMock({
			'projects:select': { data: [rawProject], error: null },
			'agenda_events:select': { data: [{ source_id: 'proj-1' }, { source_id: 'proj-1' }], error: null },
			'project_labels:select': { data: [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }], error: null },
			'project_domains:select': { data: [{ id: 'domain-1', name: 'Domain A' }], error: null },
			'view_profiles_with_display_name:select': {
				data: [
					{
						user_id: 'owner-1',
						first_name: 'Anna',
						last_name: 'Bakker',
						email: 'anna@example.com',
						avatar_url: null,
					},
				],
				error: null,
			},
		});
		const result = await fetchFn(client as never);
		expect(result.error).toBeNull();
		expect(result.projects).toHaveLength(1);
		expect(result.projects[0]).toEqual({
			...rawProject,
			label_name: 'Label A',
			domain_name: 'Domain A',
			owner_first_name: 'Anna',
			owner_last_name: 'Bakker',
			owner_email: 'anna@example.com',
			owner_avatar_url: null,
			slot_count: 2,
		});
	});
});
