import type { AgendaEventRow, AgendaEventSourceType } from '@/types/agenda-events';

export interface AgendaEventSourceSelectionState {
	selectedSourceType: AgendaEventSourceType;
	selectedProjectId: string | null;
}

export function resolveAgendaEventSourceSelection(
	event: AgendaEventRow | null | undefined,
	initialProjectId: string | null | undefined,
): AgendaEventSourceSelectionState {
	if (event) {
		return {
			selectedSourceType: event.source_type ?? 'manual',
			selectedProjectId: event.source_type === 'project' ? event.source_id : null,
		};
	}
	if (initialProjectId) {
		return {
			selectedSourceType: 'project',
			selectedProjectId: initialProjectId,
		};
	}
	return {
		selectedSourceType: 'manual',
		selectedProjectId: null,
	};
}
