import { useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { STEP_ORDER, WizardStep } from '@/components/agreements/WizardStepIndicator';
import { useAgreementWizardNavigation } from '@/components/agreements/wizard/useAgreementWizardNavigation';
import { useAgreementWizardPrefill } from '@/components/agreements/wizard/useAgreementWizardPrefill';
import { useWizardDerivedState } from '@/components/agreements/wizard/useWizardDerivedState';
import { useWizardAgreement, useWizardLessonTypes } from '@/components/agreements/wizard/wizardDataHooks';
import { wizardDefaultEndDate, wizardDefaultStartDate } from '@/components/agreements/wizard/wizardDateDefaults';
import { createInitialWizardForm, type WizardFormState } from '@/components/agreements/wizard/wizardFormTypes';
import { useAutofocus } from '@/hooks/useAutofocus';

export interface AgreementWizardUrlParams {
	id: string | undefined;
	fromRequestId: string | null;
	fromTrialId: string | null;
	prefillStudentUserId: string | null;
	prefillLessonTypeId: string | null;
	prefillOptionId: string | null;
}

export function useAgreementWizardSetup(navigate: NavigateFunction, urlParams: AgreementWizardUrlParams) {
	const isEditMode = urlParams.id !== undefined && urlParams.id !== 'new';
	const defaultStartDate = wizardDefaultStartDate();
	const defaultEndDate = wizardDefaultEndDate();

	const { agreement, loading: loadingAgreement, loadedPeriod } = useWizardAgreement(urlParams.id, isEditMode);
	const lessonTypes = useWizardLessonTypes();

	const [step, setStep] = useState<WizardStep>(WizardStep.User);
	const [form, setForm] = useState<WizardFormState>(() => createInitialWizardForm(defaultStartDate, defaultEndDate));
	const [highestStep, setHighestStep] = useState(0);
	const [partialConfirmOpen, setPartialConfirmOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const startDatePickerRef = useAutofocus<HTMLButtonElement>(step === WizardStep.Period);

	const { teachers, lessonTypeOptions } = useAgreementWizardPrefill({
		isEditMode,
		urlParams,
		step,
		form,
		setForm,
		loadingAgreement,
		agreement,
		defaultEndDate,
		setStep,
		setHighestStep,
	});

	const derived = useWizardDerivedState({ step, form, isEditMode, agreement, lessonTypes, teachers });
	const stepIndex = STEP_ORDER.indexOf(step);

	const { nextStep, prevStep, handleSave, handleSlotClick } = useAgreementWizardNavigation({
		step,
		highestStep,
		setStep,
		setHighestStep,
		form,
		agreement,
		isDuoLesson: derived.isDuoLesson,
		fromRequestId: urlParams.fromRequestId,
		fromTrialId: urlParams.fromTrialId,
		navigate,
		setSaving,
		setForm,
		setPartialConfirmOpen,
	});

	return {
		agreement,
		loadingAgreement,
		loadedPeriod,
		isEditMode,
		step,
		setStep,
		stepIndex,
		highestStep,
		form,
		setForm,
		lessonTypes,
		lessonTypeOptions,
		teachers,
		derived,
		partialConfirmOpen,
		setPartialConfirmOpen,
		saving,
		startDatePickerRef,
		nextStep,
		prevStep,
		handleSave,
		handleSlotClick,
	};
}
