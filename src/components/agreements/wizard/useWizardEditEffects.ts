import { useEffect } from 'react';
import type { WizardStep } from '@/components/agreements/WizardStepIndicator';
import type { WizardFormState } from '@/components/agreements/wizard/wizardFormTypes';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { agreementBreadcrumbItems, wizardInitFromAgreement } from '@/pages/agreementWizardLoaders';
import type { AgreementTableRow } from '@/types/lesson-agreements';

export function useWizardEditInitialization(
	loadingAgreement: boolean,
	isEditMode: boolean,
	agreement: AgreementTableRow | null,
	defaultEndDate: string,
	setStep: React.Dispatch<React.SetStateAction<WizardStep>>,
	setHighestStep: React.Dispatch<React.SetStateAction<number>>,
	setForm: React.Dispatch<React.SetStateAction<WizardFormState>>,
) {
	useEffect(() => {
		const init = wizardInitFromAgreement(loadingAgreement, isEditMode, agreement, defaultEndDate);
		if (!init) return;
		setStep(init.step);
		setHighestStep(init.highestStep);
		if (init.formPatch) setForm((f) => ({ ...f, ...init.formPatch }));
	}, [loadingAgreement, isEditMode, agreement, defaultEndDate, setStep, setHighestStep, setForm]);
}

export function useWizardBreadcrumb(
	loadingAgreement: boolean,
	isEditMode: boolean,
	agreement: AgreementTableRow | null,
	id: string | undefined,
) {
	const { setBreadcrumbSuffix } = useBreadcrumb();

	useEffect(() => {
		const suffix = agreementBreadcrumbItems(loadingAgreement, isEditMode, agreement, id);
		if (!suffix) return;
		setBreadcrumbSuffix(suffix);
		return () => setBreadcrumbSuffix([]);
	}, [loadingAgreement, isEditMode, agreement, id, setBreadcrumbSuffix]);
}
