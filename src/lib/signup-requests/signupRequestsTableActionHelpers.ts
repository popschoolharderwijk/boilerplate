import type { Tables } from '@/integrations/supabase/types';
import {
	canScheduleTrialForSignupRequest,
	isSignupRequestActionable,
} from '@/lib/signup-requests/signupRequestsTableFormatters';

export interface SignupRequestRowActionState {
	showActions: boolean;
	showTrialButton: boolean;
	isBusy: boolean;
}

export function getSignupRequestRowActionState(
	status: Tables<'lesson_signup_requests'>['status'],
	rowId: string,
	busyId: string | null,
): SignupRequestRowActionState {
	return {
		showActions: isSignupRequestActionable(status),
		showTrialButton: canScheduleTrialForSignupRequest(status),
		isBusy: busyId === rowId,
	};
}
