import { describe, expect, it } from 'bun:test';
import { shouldShowTeacherLessonTypesAddPopover } from '../../../src/components/teachers/teacherLessonTypesSectionHelpers';

describe('shouldShowTeacherLessonTypesAddPopover', () => {
	it('returns true when editing is allowed and options exist', () => {
		expect(shouldShowTeacherLessonTypesAddPopover(true, 2)).toBe(true);
	});

	it('returns false when no options exist', () => {
		expect(shouldShowTeacherLessonTypesAddPopover(true, 0)).toBe(false);
	});

	it('returns false when editing is not allowed', () => {
		expect(shouldShowTeacherLessonTypesAddPopover(false, 2)).toBe(false);
	});
});
