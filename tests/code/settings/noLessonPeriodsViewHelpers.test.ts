import { describe, expect, it } from 'bun:test';
import {
	shouldShowNoLessonPeriodsEmpty,
	shouldShowNoLessonPeriodsList,
	shouldShowNoLessonPeriodsLoading,
} from '../../../src/lib/settings/noLessonPeriodsViewHelpers';

describe('shouldShowNoLessonPeriodsLoading', () => {
	it('returns true while loading', () => {
		expect(shouldShowNoLessonPeriodsLoading(true)).toBe(true);
	});

	it('returns false when loading finished', () => {
		expect(shouldShowNoLessonPeriodsLoading(false)).toBe(false);
	});
});

describe('shouldShowNoLessonPeriodsEmpty', () => {
	it('shows empty state when not loading and no periods exist', () => {
		expect(shouldShowNoLessonPeriodsEmpty(false, 0)).toBe(true);
	});

	it('hides empty state while loading', () => {
		expect(shouldShowNoLessonPeriodsEmpty(true, 0)).toBe(false);
	});
});

describe('shouldShowNoLessonPeriodsList', () => {
	it('shows list when periods exist', () => {
		expect(shouldShowNoLessonPeriodsList(false, 2)).toBe(true);
	});

	it('hides list while loading', () => {
		expect(shouldShowNoLessonPeriodsList(true, 2)).toBe(false);
	});
});
