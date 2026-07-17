export type WizardNavLeftAction = 'prev' | 'cancel';
export type WizardNavRightAction = 'next' | 'submit';

export function resolveWizardNavLeftAction(isFirst: boolean): WizardNavLeftAction {
	return isFirst ? 'cancel' : 'prev';
}

export function resolveWizardNavRightAction(isLast: boolean): WizardNavRightAction {
	return isLast ? 'submit' : 'next';
}

export function isWizardNextEnabled(stepIndex: number, highestStep: number, stepCanProceed: boolean): boolean {
	return stepIndex < highestStep || stepCanProceed;
}

export function resolveWizardSubmitLabel(isEditMode: boolean): string {
	return isEditMode ? 'Opslaan' : 'Aanmaken';
}
