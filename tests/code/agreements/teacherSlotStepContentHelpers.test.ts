import { describe, expect, it } from 'bun:test';
import {
	groupTeacherSlotsByDay,
	resolveTeacherSelectionId,
} from '../../../src/components/agreements/teacherSlotStepContentHelpers';

describe('groupTeacherSlotsByDay', () => {
	it('groups and sorts slots by day of week', () => {
		const grouped = groupTeacherSlotsByDay([
			{ day_of_week: 2, start_time: '15:00:00', status: 'free' } as never,
			{ day_of_week: 2, start_time: '14:00:00', status: 'free' } as never,
			{ day_of_week: 4, start_time: '10:00:00', status: 'occupied' } as never,
		]);

		expect(grouped.get(2)).toHaveLength(2);
		expect(grouped.get(2)?.[0]?.start_time).toBe('14:00:00');
		expect(grouped.get(2)?.[1]?.start_time).toBe('15:00:00');
		expect(grouped.get(4)).toHaveLength(1);
	});
});

describe('resolveTeacherSelectionId', () => {
	it('returns null when user is cleared', () => {
		expect(resolveTeacherSelectionId([{ id: 'teacher-1', userId: 'user-1' }], null)).toBeNull();
	});

	it('returns teacher id when teacher is selected', () => {
		expect(resolveTeacherSelectionId([{ id: 'teacher-1', userId: 'user-1' }], { user_id: 'user-1' })).toBe(
			'teacher-1',
		);
	});

	it('falls back to user id when teacher record is missing', () => {
		expect(resolveTeacherSelectionId([], { user_id: 'user-2' })).toBe('user-2');
	});
});
