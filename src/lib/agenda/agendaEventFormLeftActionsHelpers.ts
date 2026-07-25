import type { AgendaEventFormPermissions } from '@/components/agenda/agenda-event-form-types';

export interface AgendaEventFormLeftActionVisibility {
	showDelete: boolean;
	showCancelLesson: boolean;
	showRestoreLesson: boolean;
	showMarkTrialCompleted: boolean;
}

export function resolveAgendaEventFormLeftActionVisibility(
	permissions: AgendaEventFormPermissions,
	hasOpenCancelConfirm: boolean,
	hasCancelLesson: boolean,
	hasMarkTrialCompleted: boolean,
): AgendaEventFormLeftActionVisibility {
	const { canDelete, canCancelLesson, canMarkTrialCompleted, isCancelledEvent } = permissions;

	return {
		showDelete: canDelete,
		showCancelLesson: canCancelLesson && !isCancelledEvent && hasOpenCancelConfirm,
		showRestoreLesson: canCancelLesson && isCancelledEvent && hasCancelLesson,
		showMarkTrialCompleted: canMarkTrialCompleted && hasMarkTrialCompleted,
	};
}
