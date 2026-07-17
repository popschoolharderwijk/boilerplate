import { describe, expect, it } from 'bun:test';
import {
	resolveLessonGroupDeleteDialogOpen,
	resolveLessonGroupsPageAccess,
	resolveLessonGroupsPageView,
} from '../../../src/lib/lesson-groups/lessonGroupsPageViewHelpers';

describe('resolveLessonGroupsPageAccess', () => {
	it('grants view to teachers and admins', () => {
		expect(resolveLessonGroupsPageAccess(false, false, false, true)).toEqual({
			canView: true,
			canEdit: false,
		});
		expect(resolveLessonGroupsPageAccess(true, false, false, false)).toEqual({
			canView: true,
			canEdit: true,
		});
	});
});

describe('resolveLessonGroupsPageView', () => {
	it('returns redirect when user cannot view lesson groups', () => {
		expect(resolveLessonGroupsPageView(false, false)).toBe('redirect');
	});

	it('returns content when user can view lesson groups', () => {
		expect(resolveLessonGroupsPageView(false, true)).toBe('content');
	});
});

describe('resolveLessonGroupDeleteDialogOpen', () => {
	it('returns true when dialog should stay open', () => {
		expect(resolveLessonGroupDeleteDialogOpen(true)).toBe(true);
	});

	it('returns false when dialog should close', () => {
		expect(resolveLessonGroupDeleteDialogOpen(false)).toBe(false);
	});
});
