import { describe, expect, it } from 'bun:test';
import {
	getStudentFormModeButtonVariant,
	shouldShowExistingUserPicker,
} from '../../../src/lib/students/studentFormModeSectionHelpers';

describe('shouldShowExistingUserPicker', () => {
	it('shows picker for existing-user mode', () => {
		expect(shouldShowExistingUserPicker('existing-user')).toBe(true);
	});

	it('hides picker for new-user mode', () => {
		expect(shouldShowExistingUserPicker('new-user')).toBe(false);
	});
});

describe('getStudentFormModeButtonVariant', () => {
	it('returns default for the active mode', () => {
		expect(getStudentFormModeButtonVariant('new-user', 'new-user')).toBe('default');
	});

	it('returns outline for the inactive mode', () => {
		expect(getStudentFormModeButtonVariant('new-user', 'existing-user')).toBe('outline');
	});
});
