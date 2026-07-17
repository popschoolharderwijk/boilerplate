import { describe, expect, it } from 'bun:test';
import {
	shouldLoadEligibleStudents,
	shouldLoadLessonGroupEditData,
	shouldLoadLessonGroupTeacherSlots,
	shouldLoadLessonGroupTeachers,
	shouldLoadPendingSignupRequests,
} from '../../../src/components/lesson-groups/wizard/lessonGroupDataHooksHelpers';
import { LGStep } from '../../../src/components/lesson-groups/wizard/lessonGroupWizardTypes';

describe('shouldLoadLessonGroupTeachers', () => {
	it('returns false when lesson type id is missing', () => {
		expect(shouldLoadLessonGroupTeachers(null)).toBe(false);
	});

	it('returns true when lesson type id exists', () => {
		expect(shouldLoadLessonGroupTeachers('lt-1')).toBe(true);
	});
});

describe('shouldLoadEligibleStudents', () => {
	it('returns false when lesson type id is missing', () => {
		expect(shouldLoadEligibleStudents(null)).toBe(false);
	});
});

describe('shouldLoadPendingSignupRequests', () => {
	it('returns false when lesson type id is missing', () => {
		expect(shouldLoadPendingSignupRequests(null)).toBe(false);
	});
});

describe('shouldLoadLessonGroupEditData', () => {
	it('returns false outside edit mode', () => {
		expect(shouldLoadLessonGroupEditData(false, 'group-1')).toBe(false);
	});

	it('returns true in edit mode with id', () => {
		expect(shouldLoadLessonGroupEditData(true, 'group-1')).toBe(true);
	});
});

describe('shouldLoadLessonGroupTeacherSlots', () => {
	it('returns false on non-teacher steps', () => {
		expect(
			shouldLoadLessonGroupTeacherSlots({
				step: LGStep.Basics,
				teacherUserId: 'teacher-1',
				startDate: '2026-01-01',
				endDate: '2026-06-01',
			}),
		).toBe(false);
	});

	it('returns true on teacher step with required fields', () => {
		expect(
			shouldLoadLessonGroupTeacherSlots({
				step: LGStep.Teacher,
				teacherUserId: 'teacher-1',
				startDate: '2026-01-01',
				endDate: '2026-06-01',
			}),
		).toBe(true);
	});
});
