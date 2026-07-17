import { describe, expect, it } from 'bun:test';
import {
	resolveLessonTypeInfoAccess,
	resolveLessonTypeInfoEditMode,
	resolveLessonTypeInfoViewState,
	resolveLessonTypeTitle,
} from '../../../src/lib/lesson-types/lessonTypeInfoPageHelpers';

describe('resolveLessonTypeInfoEditMode', () => {
	it('returns true for existing lesson type ids', () => {
		expect(resolveLessonTypeInfoEditMode('lesson-type-1')).toBe(true);
	});

	it('returns false for new lesson types', () => {
		expect(resolveLessonTypeInfoEditMode('new')).toBe(false);
		expect(resolveLessonTypeInfoEditMode(undefined)).toBe(false);
	});
});

describe('resolveLessonTypeInfoAccess', () => {
	it('grants access to admins and site admins', () => {
		expect(resolveLessonTypeInfoAccess(true, false)).toBe(true);
		expect(resolveLessonTypeInfoAccess(false, true)).toBe(true);
	});

	it('denies access to non-admin users', () => {
		expect(resolveLessonTypeInfoAccess(false, false)).toBe(false);
	});
});

describe('resolveLessonTypeTitle', () => {
	it('returns trimmed form name when present', () => {
		expect(resolveLessonTypeTitle('  Piano  ', true, 'Gitaar')).toBe('Piano');
	});

	it('returns existing name in edit mode when form name is empty', () => {
		expect(resolveLessonTypeTitle('', true, 'Gitaar')).toBe('Gitaar');
	});

	it('returns default edit title when no names exist', () => {
		expect(resolveLessonTypeTitle('', true, undefined)).toBe('Lessoort');
	});

	it('returns new lesson type title in create mode', () => {
		expect(resolveLessonTypeTitle('', false, undefined)).toBe('Nieuwe lessoort');
	});
});

describe('resolveLessonTypeInfoViewState', () => {
	it('returns redirect when user lacks access', () => {
		expect(
			resolveLessonTypeInfoViewState({
				authLoading: false,
				hasAccess: false,
				isEditMode: true,
				loading: false,
				id: 'lesson-type-1',
				hasLessonType: true,
			}),
		).toBe('redirect');
	});

	it('returns loading while edit data is loading', () => {
		expect(
			resolveLessonTypeInfoViewState({
				authLoading: false,
				hasAccess: true,
				isEditMode: true,
				loading: true,
				id: 'lesson-type-1',
				hasLessonType: false,
			}),
		).toBe('loading');
	});

	it('returns content when page is ready', () => {
		expect(
			resolveLessonTypeInfoViewState({
				authLoading: false,
				hasAccess: true,
				isEditMode: false,
				loading: false,
				id: 'new',
				hasLessonType: false,
			}),
		).toBe('content');
	});
});
