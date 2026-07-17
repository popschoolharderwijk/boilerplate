import { describe, expect, it } from 'bun:test';
import {
	isWizardNextEnabled,
	resolveWizardNavLeftAction,
	resolveWizardNavRightAction,
	resolveWizardSubmitLabel,
} from '../../../src/components/lesson-groups/wizard/lessonGroupWizardNavigationHelpers';

describe('resolveWizardNavLeftAction', () => {
	it('returns cancel on first step', () => {
		expect(resolveWizardNavLeftAction(true)).toBe('cancel');
	});

	it('returns prev on later steps', () => {
		expect(resolveWizardNavLeftAction(false)).toBe('prev');
	});
});

describe('resolveWizardNavRightAction', () => {
	it('returns next before last step', () => {
		expect(resolveWizardNavRightAction(false)).toBe('next');
	});

	it('returns submit on last step', () => {
		expect(resolveWizardNavRightAction(true)).toBe('submit');
	});
});

describe('isWizardNextEnabled', () => {
	it('enables next when revisiting an earlier completed step', () => {
		expect(isWizardNextEnabled(1, 3, false)).toBe(true);
	});

	it('requires stepCanProceed on the current highest step', () => {
		expect(isWizardNextEnabled(3, 3, false)).toBe(false);
		expect(isWizardNextEnabled(3, 3, true)).toBe(true);
	});
});

describe('resolveWizardSubmitLabel', () => {
	it('returns edit label in edit mode', () => {
		expect(resolveWizardSubmitLabel(true)).toBe('Opslaan');
	});

	it('returns create label for new groups', () => {
		expect(resolveWizardSubmitLabel(false)).toBe('Aanmaken');
	});
});
