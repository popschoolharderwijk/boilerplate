import { WizardStep } from '@/components/agreements/WizardStepIndicator';

export type WizardStepPanelKind = 'user' | 'period' | 'teacher-slot' | 'confirm';

export function resolveWizardStepPanelKind(step: WizardStep): WizardStepPanelKind {
	if (step === WizardStep.User) return 'user';
	if (step === WizardStep.Period) return 'period';
	if (step === WizardStep.TeacherSlot) return 'teacher-slot';
	return 'confirm';
}
