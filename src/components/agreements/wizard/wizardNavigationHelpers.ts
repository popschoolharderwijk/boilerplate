import type { NavigateFunction } from 'react-router-dom';
import type { WizardFormState } from '@/components/agreements/wizard/wizardFormTypes';
import { runWizardLoad } from '@/pages/agreementWizardLoaders';
import type { AgreementTableRow } from '@/types/lesson-agreements';

export {
	createWizardNextStepHandler,
	createWizardPrevStepHandler,
	createWizardSlotClickHandler,
} from '@/components/agreements/wizard/wizardStepNavigation';

export function createWizardSaveHandler(
	form: WizardFormState,
	agreement: AgreementTableRow | null,
	isDuoLesson: boolean,
	fromRequestId: string | null,
	fromTrialId: string | null,
	navigate: NavigateFunction,
	setSaving: (saving: boolean) => void,
) {
	return () => {
		setSaving(true);
		void runWizardLoad('save', {
			form,
			agreement,
			isDuoLesson,
			fromRequestId,
			fromTrialId,
			navigate,
		}).finally(() => setSaving(false));
	};
}
