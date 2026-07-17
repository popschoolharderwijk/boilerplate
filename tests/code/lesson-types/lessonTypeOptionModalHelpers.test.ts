import { describe, expect, it } from 'bun:test';
import {
	buildOptionModalFormFromEditing,
	isEditingExistingOption,
	resolveRemoveOptionOutcome,
	resolveSaveOptionAbortToast,
	resolveSaveOptionInModalFlow,
	shouldClearEditingOptionAfterSave,
	shouldShowLocalUpdateSuccessToast,
} from '../../../src/pages/lesson-type-info/lessonTypeOptionModalHelpers';

const editingOption = {
	id: 'option-1',
	duration_minutes: '45',
	frequency: 'weekly' as const,
	price_per_lesson: '25',
	price_per_lesson_under_21: '20',
	price_per_lesson_adult: '25',
} as const;

describe('resolveSaveOptionInModalFlow', () => {
	it('returns abort-no-editing when option is missing', () => {
		expect(
			resolveSaveOptionInModalFlow({
				editingOption: null,
				validationError: null,
				isDuplicate: false,
				isEditExisting: false,
				isEditMode: false,
				hasLessonType: false,
			}),
		).toEqual({ kind: 'abort-no-editing' });
	});

	it('returns abort-validation when form is invalid', () => {
		expect(
			resolveSaveOptionInModalFlow({
				editingOption: editingOption as never,
				validationError: 'Duur moet een positief getal zijn',
				isDuplicate: false,
				isEditExisting: true,
				isEditMode: true,
				hasLessonType: true,
			}),
		).toEqual({ kind: 'abort-validation', message: 'Duur moet een positief getal zijn' });
	});

	it('returns update-existing with database persistence in edit mode', () => {
		expect(
			resolveSaveOptionInModalFlow({
				editingOption: editingOption as never,
				validationError: null,
				isDuplicate: false,
				isEditExisting: true,
				isEditMode: true,
				hasLessonType: true,
			}),
		).toEqual({ kind: 'update-existing', persistToDatabase: true });
	});

	it('returns create-new for new option rows', () => {
		expect(
			resolveSaveOptionInModalFlow({
				editingOption: { ...editingOption, id: undefined } as never,
				validationError: null,
				isDuplicate: false,
				isEditExisting: false,
				isEditMode: true,
				hasLessonType: true,
			}),
		).toEqual({ kind: 'create-new' });
	});
});

describe('shouldShowLocalUpdateSuccessToast', () => {
	it('returns true for local-only updates', () => {
		expect(shouldShowLocalUpdateSuccessToast({ kind: 'update-existing', persistToDatabase: false })).toBe(true);
	});

	it('returns false when persisting to database', () => {
		expect(shouldShowLocalUpdateSuccessToast({ kind: 'update-existing', persistToDatabase: true })).toBe(false);
	});
});

describe('shouldClearEditingOptionAfterSave', () => {
	it('clears after successful local update', () => {
		expect(shouldClearEditingOptionAfterSave({ kind: 'update-existing', persistToDatabase: false }, true)).toBe(
			true,
		);
	});

	it('clears after successful database update', () => {
		expect(shouldClearEditingOptionAfterSave({ kind: 'update-existing', persistToDatabase: true }, true)).toBe(
			true,
		);
	});

	it('keeps modal open after failed database update', () => {
		expect(shouldClearEditingOptionAfterSave({ kind: 'update-existing', persistToDatabase: true }, false)).toBe(
			false,
		);
	});
});

describe('isEditingExistingOption', () => {
	it('returns true when option has id', () => {
		expect(isEditingExistingOption(editingOption as never)).toBe(true);
	});

	it('returns false for new option rows', () => {
		expect(isEditingExistingOption({ ...editingOption, id: undefined } as never)).toBe(false);
	});
});

describe('resolveSaveOptionAbortToast', () => {
	it('returns validation message', () => {
		expect(resolveSaveOptionAbortToast({ kind: 'abort-validation', message: 'invalid' })).toBe('invalid');
	});

	it('returns duplicate message', () => {
		expect(resolveSaveOptionAbortToast({ kind: 'abort-duplicate' })).toContain('bestaat al');
	});

	it('returns null for actionable flows', () => {
		expect(resolveSaveOptionAbortToast({ kind: 'create-new' })).toBeNull();
	});
});

describe('buildOptionModalFormFromEditing', () => {
	it('copies editable fields from the selected option', () => {
		expect(buildOptionModalFormFromEditing(editingOption as never)).toEqual({
			duration_minutes: '45',
			frequency: 'weekly',
			price_per_lesson_under_21: '20',
			price_per_lesson_adult: '25',
		});
	});
});

describe('resolveRemoveOptionOutcome', () => {
	const option = { id: 'option-1' } as never;

	it('returns noop when nothing is selected', () => {
		expect(
			resolveRemoveOptionOutcome({
				optionToDelete: null,
				index: 0,
				isEditMode: true,
				hasLessonType: true,
			}),
		).toEqual({ kind: 'noop-no-selection' });
	});

	it('returns noop when selected option is missing from form', () => {
		expect(
			resolveRemoveOptionOutcome({
				optionToDelete: option,
				index: -1,
				isEditMode: true,
				hasLessonType: true,
			}),
		).toEqual({ kind: 'noop-missing-index' });
	});

	it('returns persist delete for saved options in edit mode', () => {
		expect(
			resolveRemoveOptionOutcome({
				optionToDelete: option,
				index: 2,
				isEditMode: true,
				hasLessonType: true,
			}),
		).toEqual({ kind: 'persist-delete', optionId: 'option-1', index: 2 });
	});

	it('returns local remove for unsaved options', () => {
		expect(
			resolveRemoveOptionOutcome({
				optionToDelete: { id: undefined } as never,
				index: 1,
				isEditMode: false,
				hasLessonType: false,
			}),
		).toEqual({ kind: 'remove-local', index: 1 });
	});
});
