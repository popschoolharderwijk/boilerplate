import type { Dispatch, SetStateAction } from 'react';
import { STEP_ORDER, type WizardStep } from '@/components/agreements/WizardStepIndicator';
import type { WizardFormState } from '@/components/agreements/wizard/wizardFormTypes';
import type { SlotWithStatus } from '@/lib/agreementSlots';

function getWizardNextStepIndex(step: WizardStep): number {
	return STEP_ORDER.indexOf(step) + 1;
}

function getWizardPreviousStep(step: WizardStep): WizardStep | null {
	const stepIndex = STEP_ORDER.indexOf(step);
	if (stepIndex === 0) return null;
	return STEP_ORDER[stepIndex - 1];
}

export function createWizardNextStepHandler(
	step: WizardStep,
	highestStep: number,
	setStep: (step: WizardStep) => void,
	setHighestStep: (step: number) => void,
) {
	const stepIndex = STEP_ORDER.indexOf(step);
	const isLastStep = stepIndex === STEP_ORDER.length - 1;
	return () => {
		if (isLastStep) return;
		const next = getWizardNextStepIndex(step);
		setStep(STEP_ORDER[next]);
		if (next > highestStep) setHighestStep(next);
	};
}

export function createWizardPrevStepHandler(step: WizardStep, setStep: (step: WizardStep) => void) {
	return () => {
		const previous = getWizardPreviousStep(step);
		if (previous) setStep(previous);
	};
}

export function createWizardSlotClickHandler(
	setForm: Dispatch<SetStateAction<WizardFormState>>,
	setPartialConfirmOpen: (open: boolean) => void,
) {
	return (slot: SlotWithStatus) => {
		if (slot.status === 'occupied') return;
		setForm((f) => ({ ...f, slot }));
		if (slot.status === 'partial') {
			setPartialConfirmOpen(true);
		}
	};
}
