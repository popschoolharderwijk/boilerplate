import { describe, expect, it } from 'bun:test';
import { buildTeacherOptsFromActives, filterRowsInDateRange } from '../../../src/lib/teachers/teacherOptHelpers';

describe('buildTeacherOptsFromActives', () => {
	it('maps active teachers using profile lookup', () => {
		expect(
			buildTeacherOptsFromActives(
				[{ user_id: 'user-1' }],
				[
					{
						user_id: 'user-1',
						first_name: 'Anna',
						last_name: 'Jansen',
						email: 'anna@example.com',
						avatar_url: null,
					},
				],
			),
		).toEqual([
			{
				id: 'user-1',
				userId: 'user-1',
				firstName: 'Anna',
				lastName: 'Jansen',
				email: 'anna@example.com',
				avatarUrl: null,
			},
		]);
	});

	it('uses null profile fields when a profile is missing', () => {
		expect(buildTeacherOptsFromActives([{ user_id: 'user-2' }], [])).toEqual([
			{
				id: 'user-2',
				userId: 'user-2',
				firstName: null,
				lastName: null,
				email: null,
				avatarUrl: null,
			},
		]);
	});
});

describe('filterRowsInDateRange', () => {
	it('keeps only rows that overlap the requested range', () => {
		expect(
			filterRowsInDateRange(
				[
					{ start_date: '2026-01-01', end_date: '2026-01-31' },
					{ start_date: '2026-02-01', end_date: null },
				],
				'2026-02-01',
				'2026-03-01',
			),
		).toEqual([{ start_date: '2026-02-01', end_date: null }]);
	});

	it('excludes rows that end before the requested range', () => {
		expect(
			filterRowsInDateRange([{ start_date: '2026-01-01', end_date: '2026-01-31' }], '2026-02-01', '2026-03-01'),
		).toEqual([]);
	});

	it('includes rows that overlap the requested range', () => {
		expect(
			filterRowsInDateRange([{ start_date: '2026-01-01', end_date: '2026-06-01' }], '2026-02-01', '2026-03-01'),
		).toEqual([{ start_date: '2026-01-01', end_date: '2026-06-01' }]);
	});
});
