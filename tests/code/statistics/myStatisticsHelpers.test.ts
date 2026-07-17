import { describe, expect, it } from 'bun:test';
import { computeTeacherStatistics, isAgreementGroupLesson } from '../../../src/lib/statistics/myStatisticsHelpers';

describe('isAgreementGroupLesson', () => {
	it('reads group flag from object lesson types', () => {
		expect(isAgreementGroupLesson({ is_group_lesson: true })).toBe(true);
		expect(isAgreementGroupLesson({ is_group_lesson: false })).toBe(false);
	});

	it('reads group flag from array lesson types', () => {
		expect(isAgreementGroupLesson([{ is_group_lesson: true }])).toBe(true);
		expect(isAgreementGroupLesson([{ is_group_lesson: false }])).toBe(false);
	});

	it('returns false for missing lesson types', () => {
		expect(isAgreementGroupLesson(null)).toBe(false);
	});
});

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
});
