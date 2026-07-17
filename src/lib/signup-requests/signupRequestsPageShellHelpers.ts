import type { SignupRequestRowBase } from '@/lib/signup-requests/signupRequestsPageHelpers';

export type SignupRequestsPageGate = 'loading' | 'denied' | 'ready';

export function resolveSignupRequestsPageGate(isLoading: boolean, isPrivileged: boolean): SignupRequestsPageGate {
	if (isLoading) return 'loading';
	if (!isPrivileged) return 'denied';
	return 'ready';
}

export function resolveSignupStatusFilterVariant(
	currentFilter: 'pending' | 'all',
	option: 'pending' | 'all',
): 'default' | 'outline' {
	return currentFilter === option ? 'default' : 'outline';
}

export interface ScheduleTrialSignupRequestPayload {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	lesson_type_id: string;
	lesson_type_option_id: string | null;
}

export function buildScheduleTrialSignupRequestPayload(
	trialFor: SignupRequestRowBase | null,
): ScheduleTrialSignupRequestPayload | null {
	if (!trialFor) return null;
	return {
		id: trialFor.id,
		first_name: trialFor.first_name,
		last_name: trialFor.last_name,
		email: trialFor.email,
		lesson_type_id: trialFor.lesson_type_id,
		lesson_type_option_id: trialFor.lesson_type_option_id,
	};
}
