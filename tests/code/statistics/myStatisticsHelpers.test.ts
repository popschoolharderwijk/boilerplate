import { describe, expect, it } from 'bun:test';
import { computeTeacherStatistics } from '../../../src/lib/statistics/myStatisticsHelpers';

describe('computeTeacherStatistics', () => {
	it('counts unique students and group lessons', () => {
		expect(
			computeTeacherStatistics([
				{ student_user_id: 'student-1', lesson_types: { is_group_lesson: false } },
				{ student_user_id: 'student-1', lesson_types: { is_group_lesson: true } },
				{ student_user_id: 'student-2', lesson_types: [{ is_group_lesson: false }] },
			]),
		).toEqual({
			studentCount: 2,
			lessonsPerWeek: 3,
			groupLessons: 1,
			upcomingLessons: 3,
		});
	});

	it('returns zero counts for an empty list', () => {
		expect(computeTeacherStatistics([])).toEqual({
			studentCount: 0,
			lessonsPerWeek: 0,
			groupLessons: 0,
			upcomingLessons: 0,
		});
	});

	it('treats missing lesson types as non-group lessons', () => {
		expect(computeTeacherStatistics([{ student_user_id: 'student-1', lesson_types: null }])).toEqual({
			studentCount: 1,
			lessonsPerWeek: 1,
			groupLessons: 0,
			upcomingLessons: 1,
		});
	});

	it('reads group flag from array lesson types', () => {
		expect(
			computeTeacherStatistics([{ student_user_id: 'student-1', lesson_types: [{ is_group_lesson: true }] }]),
		).toEqual({
			studentCount: 1,
			lessonsPerWeek: 1,
			groupLessons: 1,
			upcomingLessons: 1,
		});
	});
});
