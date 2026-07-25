export function getWizardStepIndicatorButtonClass(canNavigate: boolean): string {
	if (canNavigate) {
		return 'flex flex-col items-center transition-opacity cursor-pointer hover:opacity-80';
	}
	return 'flex flex-col items-center transition-opacity cursor-not-allowed opacity-60';
}

export function shouldShowWizardStepConnector(idx: number, stepCount: number): boolean {
	return idx < stepCount - 1;
}

export function createWizardStepIndicatorClickHandler<TStep extends string>(
	canNavigate: boolean,
	onStepChange: (step: TStep) => void,
	stepKey: TStep,
): () => void {
	return () => {
		if (canNavigate) onStepChange(stepKey);
	};
}

export type WizardStepIndicatorIconKind = 'check' | 'step-icon';

export function resolveWizardStepIndicatorIconKind(isCompleted: boolean): WizardStepIndicatorIconKind {
	return isCompleted ? 'check' : 'step-icon';
}
