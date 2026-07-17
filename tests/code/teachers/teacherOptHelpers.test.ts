import { describe, expect, it } from 'bun:test';
import {
	buildTeacherOpt,
	buildTeacherOptsFromActives,
	filterRowsInDateRange,
	isBookingInDateRange,
} from '../../../src/lib/teachers/teacherOptHelpers';

describe('buildTeacherOpt', () => {
	it('maps profile fields to teacher opt fields', () => {
		expect(
			buildTeacherOpt('user-1', {
				user_id: 'user-1',
				first_name: 'Anna',
				last_name: 'Jansen',
				email: 'anna@example.com',
				avatar_url: 'https://example.com/a.png',
			}),
		).toEqual({
			id: 'user-1',
			userId: 'user-1',
			firstName: 'Anna',
			lastName: 'Jansen',
			email: 'anna@example.com',
			avatarUrl: 'https://example.com/a.png',
		});
	});

	it('returns null profile fields when profile is missing', () => {
		expect(buildTeacherOpt('user-2', undefined)).toEqual({
			id: 'user-2',
			userId: 'user-2',
			firstName: null,
			lastName: null,
			email: null,
			avatarUrl: null,
		});
	});
});

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
});

describe('isBookingInDateRange', () => {
	it('returns true when booking overlaps the requested range', () => {
		expect(
			isBookingInDateRange({ start_date: '2026-01-01', end_date: '2026-06-01' }, '2026-02-01', '2026-03-01'),
		).toBe(true);
	});

	it('returns false when booking ends before the requested range', () => {
		expect(
			isBookingInDateRange({ start_date: '2026-01-01', end_date: '2026-01-31' }, '2026-02-01', '2026-03-01'),
		).toBe(false);
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
});
