import { describe, expect, it } from 'bun:test';
import {
	resolveLessonGroupWizardSubtitle,
	resolveLessonGroupWizardTitle,
} from '../../../src/components/lesson-groups/wizard/LessonGroupWizardPageParts';

describe('resolveLessonGroupWizardTitle', () => {
	it('returns edit title with form name when editing', () => {
		expect(resolveLessonGroupWizardTitle(true, 'Groep A')).toBe('Groep A');
	});

	it('returns fallback edit title when name is empty', () => {
		expect(resolveLessonGroupWizardTitle(true, '')).toBe('Lesgroep bewerken');
	});

	it('returns create title for new groups', () => {
		expect(resolveLessonGroupWizardTitle(false, '')).toBe('Nieuwe lesgroep');
	});
});

describe('resolveLessonGroupWizardSubtitle', () => {
	it('returns edit subtitle when editing', () => {
		expect(resolveLessonGroupWizardSubtitle(true)).toBe('Wijzig de groepsinstellingen');
	});

	it('returns create subtitle for new groups', () => {
		expect(resolveLessonGroupWizardSubtitle(false)).toBe('Stap voor stap een groepsles inplannen');
	});
});
