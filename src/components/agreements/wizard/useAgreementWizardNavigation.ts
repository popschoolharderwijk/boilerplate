import { type Dispatch, type SetStateAction, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { WizardStep } from '@/components/agreements/WizardStepIndicator';
import type { WizardFormState } from '@/components/agreements/wizard/wizardFormTypes';
import {
	createWizardNextStepHandler,
	createWizardPrevStepHandler,
	createWizardSaveHandler,
	createWizardSlotClickHandler,
} from '@/components/agreements/wizard/wizardNavigationHelpers';
import type { AgreementTableRow } from '@/types/lesson-agreements';

interface UseAgreementWizardNavigationParams {
	step: WizardStep;
	highestStep: number;
	setStep: (step: WizardStep) => void;
	setHighestStep: (step: number) => void;
	form: WizardFormState;
	agreement: AgreementTableRow | null;
	isDuoLesson: boolean;
	fromRequestId: string | null;
	fromTrialId: string | null;
	navigate: NavigateFunction;
	setSaving: (saving: boolean) => void;
	setForm: Dispatch<SetStateAction<WizardFormState>>;
	setPartialConfirmOpen: (open: boolean) => void;
}

export function useAgreementWizardNavigation(params: UseAgreementWizardNavigationParams) {
	const nextStep = useMemo(
		() => createWizardNextStepHandler(params.step, params.highestStep, params.setStep, params.setHighestStep),
		[params.step, params.highestStep, params.setStep, params.setHighestStep],
	);
	const prevStep = useMemo(
		() => createWizardPrevStepHandler(params.step, params.setStep),
		[params.step, params.setStep],
	);
	const handleSave = useMemo(
		() =>
			createWizardSaveHandler(
				params.form,
				params.agreement,
				params.isDuoLesson,
				params.fromRequestId,
				params.fromTrialId,
				params.navigate,
				params.setSaving,
			),
		[
			params.form,
			params.agreement,
			params.isDuoLesson,
			params.fromRequestId,
			params.fromTrialId,
			params.navigate,
			params.setSaving,
		],
	);
	const handleSlotClick = useMemo(
		() => createWizardSlotClickHandler(params.setForm, params.setPartialConfirmOpen),
		[params.setForm, params.setPartialConfirmOpen],
	);

	return { nextStep, prevStep, handleSave, handleSlotClick };
}
