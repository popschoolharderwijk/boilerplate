import { describe, expect, it } from 'bun:test';
import {
	resolveLessonGroupWizardPageGate,
	shouldRedirectLessonGroupWizard,
	shouldShowLessonGroupWizardLoading,
} from '../../../src/lib/lesson-groups/lessonGroupWizardShellHelpers';

describe('shouldShowLessonGroupWizardLoading', () => {
	it('returns true while page is loading', () => {
		expect(shouldShowLessonGroupWizardLoading('loading')).toBe(true);
	});

	it('returns false when page is ready or denied', () => {
		expect(shouldShowLessonGroupWizardLoading('ready')).toBe(false);
		expect(shouldShowLessonGroupWizardLoading('denied')).toBe(false);
	});
});

describe('shouldRedirectLessonGroupWizard', () => {
	it('returns true when access is denied', () => {
		expect(shouldRedirectLessonGroupWizard('denied')).toBe(true);
	});

	it('returns false for other gates', () => {
		expect(shouldRedirectLessonGroupWizard('ready')).toBe(false);
	});
});

describe('resolveLessonGroupWizardPageGate', () => {
	it('returns loading while auth or data loads', () => {
		expect(resolveLessonGroupWizardPageGate(true, false, true)).toBe('loading');
		expect(resolveLessonGroupWizardPageGate(false, true, true)).toBe('loading');
	});

	it('returns denied when user cannot edit', () => {
		expect(resolveLessonGroupWizardPageGate(false, false, false)).toBe('denied');
	});

	it('returns ready when user can edit', () => {
		expect(resolveLessonGroupWizardPageGate(false, false, true)).toBe('ready');
	});
});
