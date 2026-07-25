import { beforeEach, describe, expect, it } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchLessonGroupTableRows } from '../../../src/lib/lesson-groups/lessonGroupsPageHelpers';

type QueryResult = { data: unknown; error: null };

function createClient(responses: Record<string, QueryResult>): SupabaseClient {
	const createSelectChain = (table: string) => ({
		order: () => Promise.resolve(responses[`${table}:order`] ?? { data: [], error: null }),
		in: () => ({
			is: () =>
				Promise.resolve(responses[`${table}:is`] ?? responses[`${table}:in`] ?? { data: [], error: null }),
			// biome-ignore lint/suspicious/noThenProperty: supabase query builder mock
			then(onFulfilled?: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) {
				return Promise.resolve(responses[`${table}:in`] ?? { data: [], error: null }).then(
					onFulfilled,
					onRejected,
				);
			},
		}),
	});

	return {
		from: (table: string) => ({
			select: (_cols: string) => createSelectChain(table),
		}),
	} as unknown as SupabaseClient;
}

describe('fetchLessonGroupTableRows', () => {
	let client: SupabaseClient;

	beforeEach(() => {
		client = createClient({
			'lesson_groups:order': {
				data: [
					{
						id: 'group-1',
						name: 'Beginners',
						lesson_type_id: 'lt-1',
						teacher_user_id: 'tea-1',
						day_of_week: 1,
						start_time: '09:00:00',
						duration_minutes: 60,
						frequency: 'weekly',
						start_date: '2026-09-01',
						end_date: null,
						created_at: '2026-01-01T00:00:00Z',
						updated_at: '2026-01-01T00:00:00Z',
					},
				],
				error: null,
			},
			'lesson_types:in': { data: [{ id: 'lt-1', name: 'Piano' }], error: null },
			'view_profiles_with_display_name:in': {
				data: [
					{
						user_id: 'tea-1',
						first_name: 'Piet',
						last_name: 'Docent',
						email: 'piet@example.com',
						avatar_url: null,
					},
					{
						user_id: 'stu-1',
						first_name: 'Anna',
						last_name: 'Leerling',
						email: 'anna@example.com',
					},
				],
				error: null,
			},
			'lesson_group_members:is': {
				data: [{ lesson_group_id: 'group-1', student_user_id: 'stu-1' }],
				error: null,
			},
		});
	});

	it('returns mapped lesson group table rows', async () => {
		const rows = await fetchLessonGroupTableRows(client);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.name).toBe('Beginners');
		expect(rows[0]?.lesson_type_name).toBe('Piano');
		expect(rows[0]?.teacher_email).toBe('piet@example.com');
		expect(rows[0]?.members).toEqual([
			{
				user_id: 'stu-1',
				first_name: 'Anna',
				last_name: 'Leerling',
				email: 'anna@example.com',
			},
		]);
	});

	it('returns an empty array when there are no groups', async () => {
		const emptyClient = createClient({
			'lesson_groups:order': { data: [], error: null },
		});
		const rows = await fetchLessonGroupTableRows(emptyClient);
		expect(rows).toEqual([]);
	});
});
