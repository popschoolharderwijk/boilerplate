import { describe, expect, it } from 'bun:test';
import { WizardStep } from '../../../src/components/agreements/WizardStepIndicator';
import type { WizardFormState } from '../../../src/components/agreements/wizard/wizardFormTypes';
import {
	createWizardNextStepHandler,
	createWizardPrevStepHandler,
	createWizardSlotClickHandler,
} from '../../../src/components/agreements/wizard/wizardStepNavigation';
import type { SlotWithStatus } from '../../../src/lib/agreementSlots';

describe('createWizardNextStepHandler', () => {
	it('advances step and highest step', () => {
		let currentStep: WizardStep = WizardStep.User;
		let highest = 0;
		const handler = createWizardNextStepHandler(
			WizardStep.User,
			highest,
			(step) => {
				currentStep = step;
			},
			(step) => {
				highest = step;
			},
		);
		handler();
		expect(currentStep as string).toBe('period');
		expect(highest).toBe(1);
	});

	it('does nothing on last step', () => {
		let currentStep: WizardStep = WizardStep.Confirm;
		let highest = 5;
		const handler = createWizardNextStepHandler(
			WizardStep.Confirm,
			highest,
			(step) => {
				currentStep = step;
			},
			(step) => {
				highest = step;
			},
		);
		handler();
		expect(currentStep as string).toBe('confirm');
		expect(highest).toBe(5);
	});
});

describe('createWizardPrevStepHandler', () => {
	it('moves to previous step', () => {
		let currentStep: WizardStep = WizardStep.Period;
		const handler = createWizardPrevStepHandler(WizardStep.Period, (step) => {
			currentStep = step;
		});
		handler();
		expect(currentStep as string).toBe('user');
	});

	it('does nothing on first step', () => {
		let currentStep: WizardStep = WizardStep.User;
		const handler = createWizardPrevStepHandler(WizardStep.User, (step) => {
			currentStep = step;
		});
		handler();
		expect(currentStep as string).toBe('user');
	});
});

describe('createWizardSlotClickHandler', () => {
	it('ignores occupied slots', () => {
		let form: WizardFormState | null = null;
		let partialOpen = false;
		const handler = createWizardSlotClickHandler(
			(updater) => {
				form = typeof updater === 'function' ? updater({} as WizardFormState) : updater;
			},
			(open) => {
				partialOpen = open;
			},
		);
		handler({ status: 'occupied' } as unknown as SlotWithStatus);
		expect(form).toBeNull();
		expect(partialOpen).toBe(false);
	});

	it('sets slot and opens confirm for partial slots', () => {
		let form: WizardFormState | null = null;
		let partialOpen = false;
		const slot = {
			day_of_week: 1,
			start_time: '10:00',
			end_time: '10:30',
			status: 'partial',
			totalOccurrences: 2,
			occupiedOccurrences: 1,
		} as SlotWithStatus;
		const handler = createWizardSlotClickHandler(
			(updater) => {
				form = typeof updater === 'function' ? updater({} as WizardFormState) : updater;
			},
			(open) => {
				partialOpen = open;
			},
		);
		handler(slot);
		expect((form as WizardFormState | null)?.slot).toEqual(slot);
		expect(partialOpen).toBe(true);
	});
});
