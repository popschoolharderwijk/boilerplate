import type { DeleteScope } from '@/types/agenda-events';

export type AgendaFormSubmitAction = 'missing-fields' | 'missing-project' | 'open-recurrence' | 'save-all';

export interface ResolveAgendaFormSubmitActionInput {
	userId: string | undefined;
	startDate: string | null;
	startTime: string;
	isProjectEvent: boolean;
	selectedProjectId: string | null;
	eventId: string | undefined;
	isRecurringEvent: boolean;
}

function hasRequiredAgendaFormFields(input: ResolveAgendaFormSubmitActionInput): boolean {
	return Boolean(input.userId && input.startDate && input.startTime);
}

function needsAgendaProjectSelection(input: ResolveAgendaFormSubmitActionInput): boolean {
	return input.isProjectEvent && !input.selectedProjectId && !input.eventId;
}

function shouldOpenAgendaRecurrenceEditor(input: ResolveAgendaFormSubmitActionInput): boolean {
	return Boolean(input.eventId && input.isRecurringEvent);
}

export function resolveAgendaFormSubmitAction(input: ResolveAgendaFormSubmitActionInput): AgendaFormSubmitAction {
	if (!hasRequiredAgendaFormFields(input)) {
		return 'missing-fields';
	}
	if (needsAgendaProjectSelection(input)) {
		return 'missing-project';
	}
	if (shouldOpenAgendaRecurrenceEditor(input)) {
		return 'open-recurrence';
	}
	return 'save-all';
}

export type AgendaDeleteClickAction = 'noop' | 'open-recurrence' | 'open-confirm';

export interface ResolveAgendaDeleteClickActionInput {
	canDelete: boolean;
	eventId: string | undefined;
	isRecurringEvent: boolean;
}

function canStartAgendaDelete(input: ResolveAgendaDeleteClickActionInput): boolean {
	return input.canDelete && Boolean(input.eventId);
}

export function resolveAgendaDeleteClickAction(input: ResolveAgendaDeleteClickActionInput): AgendaDeleteClickAction {
	if (!canStartAgendaDelete(input)) {
		return 'noop';
	}
	if (input.isRecurringEvent) {
		return 'open-recurrence';
	}
	return 'open-confirm';
}

function canExecuteAgendaMutation(allowed: boolean, eventId: string | undefined, handler: unknown): boolean {
	return allowed && Boolean(eventId) && Boolean(handler);
}

export function getAgendaRevertErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'Terugzetten mislukt';
}

export async function executeAgendaDelete(params: {
	canDelete: boolean;
	eventId: string | undefined;
	onDelete: ((eventId: string, scope: DeleteScope, occurrenceDate?: string) => void | Promise<void>) | undefined;
	scope: DeleteScope;
	occurrenceDate?: string;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}): Promise<void> {
	if (
		!canExecuteAgendaMutation(params.canDelete, params.eventId, params.onDelete) ||
		!params.onDelete ||
		!params.eventId
	) {
		return;
	}
	await params.onDelete(params.eventId, params.scope, params.occurrenceDate);
	params.onOpenChange(false);
	params.onSuccess?.();
}
