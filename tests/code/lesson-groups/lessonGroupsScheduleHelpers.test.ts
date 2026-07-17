import { describe, expect, it } from 'bun:test';
import { formatLessonGroupMemberLabel } from '../../../src/lib/lesson-groups/lessonGroupsPageHelpers';
import {
	computeLessonGroupEndTime,
	computeLessonGroupFirstDate,
} from '../../../src/lib/lesson-groups/lessonGroupsScheduleHelpers';

describe('computeLessonGroupEndTime', () => {
	it('adds duration minutes to the start time', () => {
		expect(computeLessonGroupEndTime('14:00', 45)).toBe('14:45:00');
		expect(computeLessonGroupEndTime('23:30', 60)).toBe('00:30:00');
	});
});

describe('computeLessonGroupFirstDate', () => {
	it('returns the first matching weekday on or after the start date', () => {
		expect(computeLessonGroupFirstDate('2026-09-01', 1)).toBe('2026-09-07');
		expect(computeLessonGroupFirstDate('2026-09-07', 1)).toBe('2026-09-07');
	});
});

describe('formatLessonGroupMemberLabel', () => {
	it('joins first and last name', () => {
		expect(
			formatLessonGroupMemberLabel({
				user_id: 'stu-1',
				first_name: 'Anna',
				last_name: 'Bakker',
				email: 'anna@example.com',
			}),
		).toBe('Anna Bakker');
	});

	it('falls back to email and then Onbekend', () => {
		expect(
			formatLessonGroupMemberLabel({
				user_id: 'stu-2',
				first_name: null,
				last_name: null,
				email: 'bram@example.com',
			}),
		).toBe('bram@example.com');
		expect(
			formatLessonGroupMemberLabel({
				user_id: 'stu-3',
				first_name: null,
				last_name: null,
				email: null,
			}),
		).toBe('Onbekend');
	});
});
