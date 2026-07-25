import type { IconType } from 'react-icons';

export interface WizardStepDef<TStep extends string> {
	key: TStep;
	label: string;
	icon: IconType;
}

export function getWizardStepVisualState(
	idx: number,
	stepIndex: number,
	highestReachedStepIndex: number,
	isActive: boolean,
) {
	const isCompleted = idx < stepIndex;
	const wasReached = idx <= highestReachedStepIndex;
	const canNavigate = wasReached || isActive;
	return { isCompleted, wasReached, canNavigate };
}

export function getWizardStepCircleClass(isActive: boolean, isCompleted: boolean, wasReached: boolean): string {
	if (isActive) return 'border-primary bg-primary text-primary-foreground';
	if (isCompleted) return 'border-primary bg-transparent text-primary';
	if (wasReached) return 'border-primary/50 bg-transparent text-primary/70';
	return 'border-muted-foreground/30 text-muted-foreground';
}

export function getWizardStepLabelClass(isActive: boolean, wasReached: boolean): string {
	if (isActive) return 'text-primary';
	if (wasReached) return 'text-primary/70';
	return 'text-muted-foreground';
}

export function getWizardStepConnectorClass(isCompleted: boolean, wasReached: boolean): string {
	if (isCompleted) return 'bg-primary';
	if (wasReached) return 'bg-primary/50';
	return 'bg-muted-foreground/30';
}
