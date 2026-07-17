import { describe, expect, it } from 'bun:test';
import { buildLessonTypeInfoPageResult } from '../../../src/lib/lesson-types/lessonTypeInfoPageControllerHelpers';

describe('buildLessonTypeInfoPageResult', () => {
	it('returns the provided page result fields', () => {
		expect(
			buildLessonTypeInfoPageResult({
				authLoading: false,
				hasAccess: true,
				isEditMode: false,
				lessonTypeTitle: 'Nieuwe lessoort',
			}).lessonTypeTitle,
		).toBe('Nieuwe lessoort');
	});
});
