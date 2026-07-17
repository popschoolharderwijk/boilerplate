import type { AgendaEventFormPermissions } from '@/components/agenda/agenda-event-form-types';

export interface AgendaEventFormFooterState {
	saving: boolean;
	reverting: boolean;
	isCancelling: boolean;
	isMarkingTrialCompleted: boolean;
	hasChanges: boolean;
	isEditing: boolean;
}

export function getFooterLayoutClass(hasLeftActions: boolean): string {
	return `flex-wrap gap-2 ${hasLeftActions ? 'sm:justify-between' : 'sm:justify-end'}`;
}

export function hasLeftFooterActions(permissions: AgendaEventFormPermissions): boolean {
	const { canDelete, canCancelLesson, canMarkTrialCompleted } = permissions;
	return canDelete || canCancelLesson || canMarkTrialCompleted;
}

export function isFooterBusy(state: AgendaEventFormFooterState): boolean {
	return state.saving || state.reverting || state.isCancelling;
}

export function getCloseButtonLabel(isCancelledEvent: boolean): string {
	return isCancelledEvent ? 'Sluiten' : 'Annuleren';
}

export function getSubmitButtonLabel(saving: boolean, isEditing: boolean): string {
	if (saving) return 'Opslaan...';
	return isEditing ? 'Bijwerken' : 'Aanmaken';
}

export function getAsyncActionLabel(isBusy: boolean, idleLabel: string): string {
	return isBusy ? 'Bezig...' : idleLabel;
}

export function isSubmitDisabled(state: AgendaEventFormFooterState, isCancelledEvent: boolean): boolean {
	if (isCancelledEvent) return true;
	return isFooterBusy(state) || (state.isEditing && !state.hasChanges);
}
