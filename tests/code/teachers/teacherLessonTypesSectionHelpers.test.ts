import { describe, expect, it } from 'bun:test';
import {
	shouldShowTeacherLessonTypesAddPopover,
	shouldShowTeacherLessonTypesEmptyState,
} from '../../../src/components/teachers/teacherLessonTypesSectionHelpers';

describe('shouldShowTeacherLessonTypesAddPopover', () => {
	it('returns true when editing is allowed and options exist', () => {
		expect(shouldShowTeacherLessonTypesAddPopover(true, 2)).toBe(true);
	});

	it('returns false when no options exist', () => {
		expect(shouldShowTeacherLessonTypesAddPopover(true, 0)).toBe(false);
	});
});

describe('shouldShowTeacherLessonTypesEmptyState', () => {
	it('returns true when no lesson types are assigned', () => {
		expect(shouldShowTeacherLessonTypesEmptyState(0)).toBe(true);
	});

	it('returns false when lesson types exist', () => {
		expect(shouldShowTeacherLessonTypesEmptyState(1)).toBe(false);
	});
});
