import type { SignupStep } from '@/pages/public-signup/types';

export type PublicSignupRenderStep = 1 | 2 | 3 | null;

export function resolvePublicSignupRenderStep(step: SignupStep, hasSelectedType: boolean): PublicSignupRenderStep {
	if (step === 1) return 1;
	if (step === 2 && hasSelectedType) return 2;
	if (step === 3) return 3;
	return null;
}
