import { describe, expect, it } from 'bun:test';
import {
	shouldLoadLessonGroupEditData,
	shouldLoadLessonGroupTeacherSlots,
} from '../../../src/components/lesson-groups/wizard/lessonGroupDataHooksHelpers';
import { LGStep } from '../../../src/components/lesson-groups/wizard/lessonGroupWizardTypes';

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
