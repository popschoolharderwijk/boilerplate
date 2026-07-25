import type { WizardInitialAgreement } from '@/types/lesson-agreements';

export interface ConfirmStepPeriodBounds {
	periodStart: string;
	periodEnd: string | null | undefined;
}

export function resolveConfirmStepPeriodBounds(
	initialAgreement: WizardInitialAgreement,
	loadedPeriod: { start_date: string; end_date: string | null } | null,
): ConfirmStepPeriodBounds {
	return {
		periodStart: loadedPeriod?.start_date ?? initialAgreement.start_date ?? '',
		periodEnd: loadedPeriod?.end_date ?? initialAgreement.end_date,
	};
}
