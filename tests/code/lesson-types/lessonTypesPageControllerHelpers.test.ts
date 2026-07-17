import { describe, expect, it } from 'bun:test';
import { filterDeletedLessonType } from '../../../src/lib/lesson-types/lessonTypesPageControllerHelpers';

describe('filterDeletedLessonType', () => {
	it('removes the deleted lesson type from the list', () => {
		expect(
			filterDeletedLessonType(
				[
					{
						id: 'lt-1',
						name: 'Piano',
						description: null,
						icon: 'piano',
						color: '#000',
						cost_center: null,
						is_group_lesson: false,
						is_active: true,
						created_at: '2026-01-01T00:00:00Z',
						updated_at: '2026-01-01T00:00:00Z',
						options_count: 2,
					},
					{
						id: 'lt-2',
						name: 'Gitaar',
						description: null,
						icon: 'guitar',
						color: '#111',
						cost_center: null,
						is_group_lesson: false,
						is_active: true,
						created_at: '2026-01-01T00:00:00Z',
						updated_at: '2026-01-01T00:00:00Z',
						options_count: 1,
					},
				],
				'lt-1',
			),
		).toEqual([
			{
				id: 'lt-2',
				name: 'Gitaar',
				description: null,
				icon: 'guitar',
				color: '#111',
				cost_center: null,
				is_group_lesson: false,
				is_active: true,
				created_at: '2026-01-01T00:00:00Z',
				updated_at: '2026-01-01T00:00:00Z',
				options_count: 1,
			},
		]);
	});
});
