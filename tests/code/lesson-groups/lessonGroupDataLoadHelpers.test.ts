import { describe, expect, it } from 'bun:test';
import { buildLessonGroupEditInitial } from '../../../src/components/lesson-groups/wizard/lessonGroupDataLoadHelpers';

const groupRow = {
	name: 'Groep A',
	lesson_type_id: 'lt-1',
	duration_minutes: 45,
	frequency: 'weekly',
	price_per_lesson: 25,
	start_date: '2026-09-01',
	end_date: null,
	teacher_user_id: 'teacher-1',
	day_of_week: 1,
	start_time: '09:00',
};

describe('buildLessonGroupEditInitial', () => {
	it('maps group row and members to edit initial state', () => {
		expect(
			buildLessonGroupEditInitial(
				groupRow,
				[{ student_user_id: 'student-1' }, { student_user_id: 'student-2' }],
				'2027-06-30',
			),
		).toEqual({
			name: 'Groep A',
			lessonTypeId: 'lt-1',
			durationMinutes: 45,
			frequency: 'weekly',
			pricePerLesson: 25,
			startDate: '2026-09-01',
			endDate: '2027-06-30',
			teacherUserId: 'teacher-1',
			slot: {
				day_of_week: 1,
				start_time: '09:00',
				end_time: '09:00',
				status: 'free',
				occupiedOccurrences: 0,
				totalOccurrences: 0,
			},
			memberIds: ['student-1', 'student-2'],
		});
	});

	it('uses provided end date when group has one', () => {
		const result = buildLessonGroupEditInitial({ ...groupRow, end_date: '2026-12-31' }, [], '2027-06-30');
		expect(result.endDate).toBe('2026-12-31');
	});
});
