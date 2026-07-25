import { describe, expect, it } from 'bun:test';
import { WizardStep } from '../../../src/components/agreements/WizardStepIndicator';
import { resolveWizardStepPanelKind } from '../../../src/components/agreements/wizardStepBodyHelpers';

describe('resolveWizardStepPanelKind', () => {
	it('maps user step to user panel', () => {
		expect(resolveWizardStepPanelKind(WizardStep.User)).toBe('user');
	});

	it('maps period step to period panel', () => {
		expect(resolveWizardStepPanelKind(WizardStep.Period)).toBe('period');
	});

	it('maps teacher slot step to teacher-slot panel', () => {
		expect(resolveWizardStepPanelKind(WizardStep.TeacherSlot)).toBe('teacher-slot');
	});

	it('maps confirm step to confirm panel', () => {
		expect(resolveWizardStepPanelKind(WizardStep.Confirm)).toBe('confirm');
	});
});
