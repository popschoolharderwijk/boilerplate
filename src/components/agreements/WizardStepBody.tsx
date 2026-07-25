import { useMemo } from 'react';
import {
	type AgreementWizardState,
	createWizardFormUpdaters,
	getCurrentAgreementSlot,
} from '@/components/agreements/wizard/useAgreementWizard';
import { resolveWizardStepPanelKind } from '@/components/agreements/wizardStepBodyHelpers';
import { WIZARD_STEP_PANELS } from '@/components/agreements/wizardStepBodyPanels';

interface WizardStepBodyProps {
	wizard: AgreementWizardState;
}

export function WizardStepBody({ wizard }: WizardStepBodyProps) {
	const updaters = useMemo(() => createWizardFormUpdaters(wizard.setForm), [wizard.setForm]);
	const currentAgreementSlot = getCurrentAgreementSlot(
		wizard.isEditMode,
		wizard.agreement,
		wizard.form.teacherUserId,
	);
	const Panel = WIZARD_STEP_PANELS[resolveWizardStepPanelKind(wizard.step)];

	return <Panel wizard={wizard} updaters={updaters} currentAgreementSlot={currentAgreementSlot} />;
}
