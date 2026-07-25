import { describe, expect, it } from 'bun:test';
import { resolveTrialLessonSlotRowClassName } from '../../../src/lib/trial-lessons/trialLessonSlotRowHelpers';

describe('resolveTrialLessonSlotRowClassName', () => {
	it('returns base classes without selection highlight', () => {
		expect(resolveTrialLessonSlotRowClassName(false)).toBe(
			'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ',
		);
	});

	it('returns selected classes when slot is selected', () => {
		expect(resolveTrialLessonSlotRowClassName(true)).toBe(
			'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent bg-accent',
		);
	});
});
