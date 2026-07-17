import { describe, expect, it } from 'bun:test';
import {
	executeLoadMyStatistics,
	shouldLoadMyStatistics,
	shouldRedirectMyStatistics,
	shouldShowMyStatisticsSkeleton,
} from '../../../src/lib/statistics/myStatisticsPageHelpers';

describe('shouldLoadMyStatistics', () => {
	it('returns true when auth is ready and user is teacher', () => {
		expect(shouldLoadMyStatistics(false, true)).toBe(true);
	});

	it('returns false while auth is loading', () => {
		expect(shouldLoadMyStatistics(true, true)).toBe(false);
	});
});

describe('shouldRedirectMyStatistics', () => {
	it('redirects non-teachers after auth loads', () => {
		expect(shouldRedirectMyStatistics(false, false)).toBe(true);
	});

	it('does not redirect teachers', () => {
		expect(shouldRedirectMyStatistics(false, true)).toBe(false);
	});
});

describe('shouldShowMyStatisticsSkeleton', () => {
	it('shows skeleton while auth or data is loading', () => {
		expect(shouldShowMyStatisticsSkeleton(true, false)).toBe(true);
		expect(shouldShowMyStatisticsSkeleton(false, true)).toBe(true);
	});

	it('hides skeleton when ready', () => {
		expect(shouldShowMyStatisticsSkeleton(false, false)).toBe(false);
	});
});

describe('executeLoadMyStatistics', () => {
	it('skips loading when teacher user id is missing', async () => {
		const outcome = await executeLoadMyStatistics({
			isTeacher: true,
			teacherUserId: null,
			queryAgreements: async () => ({ data: [], error: null }),
		});
		expect(outcome).toEqual({ kind: 'skipped' });
	});

	it('skips loading when user is not a teacher', async () => {
		const outcome = await executeLoadMyStatistics({
			isTeacher: false,
			teacherUserId: 'teacher-1',
			queryAgreements: async () => ({ data: [], error: null }),
		});
		expect(outcome).toEqual({ kind: 'skipped' });
	});

	it('returns stats when agreements load succeeds', async () => {
		const outcome = await executeLoadMyStatistics({
			isTeacher: true,
			teacherUserId: 'teacher-1',
			queryAgreements: async () => ({
				data: [{ student_user_id: 'student-1', lesson_types: { is_group_lesson: false } }],
				error: null,
			}),
		});
		expect(outcome).toEqual({
			kind: 'success',
			stats: {
				studentCount: 1,
				lessonsPerWeek: 1,
				groupLessons: 0,
				upcomingLessons: 1,
			},
		});
	});

	it('returns error when agreements query fails', async () => {
		const outcome = await executeLoadMyStatistics({
			isTeacher: true,
			teacherUserId: 'teacher-1',
			queryAgreements: async () => ({ data: null, error: { message: 'denied' } }),
		});
		expect(outcome).toEqual({ kind: 'error' });
	});
});
