import { describe, expect, it } from 'bun:test';
import {
	applyDuoLessonToggle,
	applyGroupLessonToggle,
	shouldDisableLessonTypeSubmit,
	updateLessonTypeFormActive,
	updateLessonTypeFormName,
} from '../../../src/lib/lesson-types/lessonTypeFormCardHelpers';

const baseForm = {
	name: 'Gitaar',
	description: '',
	icon: 'guitar',
	color: '#000000',
	cost_center: '',
	is_group_lesson: false,
	is_duo_lesson: false,
	is_active: true,
};

describe('applyGroupLessonToggle', () => {
	it('enables group lesson and disables duo lesson', () => {
		expect(applyGroupLessonToggle({ ...baseForm, is_duo_lesson: true }, true)).toEqual({
			...baseForm,
			is_group_lesson: true,
			is_duo_lesson: false,
		});
	});
});

describe('applyDuoLessonToggle', () => {
	it('enables duo lesson and disables group lesson', () => {
		expect(applyDuoLessonToggle({ ...baseForm, is_group_lesson: true }, true)).toEqual({
			...baseForm,
			is_duo_lesson: true,
			is_group_lesson: false,
		});
	});
});

describe('updateLessonTypeFormName', () => {
	it('updates the lesson type name', () => {
		expect(updateLessonTypeFormName(baseForm, 'Piano')).toEqual({ ...baseForm, name: 'Piano' });
	});
});

describe('updateLessonTypeFormActive', () => {
	it('updates the active flag', () => {
		expect(updateLessonTypeFormActive(baseForm, false)).toEqual({ ...baseForm, is_active: false });
	});
});

describe('shouldDisableLessonTypeSubmit', () => {
	it('disables submit when form is invalid or saving', () => {
		expect(shouldDisableLessonTypeSubmit(false, false)).toBe(true);
		expect(shouldDisableLessonTypeSubmit(true, true)).toBe(true);
	});

	it('enables submit when form is valid and not saving', () => {
		expect(shouldDisableLessonTypeSubmit(true, false)).toBe(false);
	});
});
