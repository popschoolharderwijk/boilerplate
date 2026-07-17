import type { AgendaViewDerivedState } from '@/components/agenda/agendaViewDerivedState';
import type { useAgendaUI } from '@/hooks/useAgendaUI';
import { formatDateToDb } from '@/lib/date/date-format';

type AgendaUI = ReturnType<typeof useAgendaUI>;

export interface AgendaEventFormDialogContainerInput {
	ui: AgendaUI;
	derived: AgendaViewDerivedState;
	canEdit: boolean;
	canManageAgenda: boolean;
	reloadAgenda: () => void | Promise<void>;
	handleCancelLesson: () => Promise<void>;
}

export function resolveAgendaEventOccurrenceDate(selectedEvent: AgendaUI['selectedEvent']): string | null {
	if (!selectedEvent?.start) return null;
	return formatDateToDb(selectedEvent.start);
}

export interface AgendaSelectedResource {
	isCancelled?: boolean;
}

export function resolveAgendaCancelLessonHandler(
	selectedResource: AgendaSelectedResource | undefined,
	canEdit: boolean,
	hasUser: boolean,
	handleCancelLesson: () => Promise<void>,
): (() => Promise<void>) | undefined {
	if (!selectedResource?.isCancelled || !canEdit || !hasUser) return undefined;
	return handleCancelLesson;
}

export function buildAgendaEventFormDialogContainerInput(
	ui: AgendaUI,
	derived: AgendaViewDerivedState,
	canEdit: boolean,
	canManageAgenda: boolean,
	reloadAgenda: () => void | Promise<void>,
	handleCancelLesson: () => Promise<void>,
): AgendaEventFormDialogContainerInput {
	return { ui, derived, canEdit, canManageAgenda, reloadAgenda, handleCancelLesson };
}
