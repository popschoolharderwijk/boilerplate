import { describe, expect, it } from 'bun:test';
import { createTrialLessonClearSelectedHandler } from '../../../src/hooks/useTrialLessonSlotMaps';

describe('createTrialLessonClearSelectedHandler', () => {
	it('clears the selected slot', () => {
		const cleared: Array<null> = [];
		const handler = createTrialLessonClearSelectedHandler((value) => cleared.push(value));
		handler();
		expect(cleared).toEqual([null]);
	});
});
