import type { User } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { executeAgendaEventDrop } from '@/components/agenda/agendaViewDropHelpers';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import type { useAgendaData } from '@/hooks/useAgendaData';
import type { useAgendaUI } from '@/hooks/useAgendaUI';
import { supabase } from '@/integrations/supabase/client';
import { cancelLesson } from '@/lib/agenda/cancelLesson';
import type { AgendaEventRow, CancellationType } from '@/types/agenda-events';

type AgendaData = ReturnType<typeof useAgendaData>;
type AgendaUI = ReturnType<typeof useAgendaUI>;

interface HandlersInput {
	ui: AgendaUI;
	canEdit: boolean;
	user: User | null;
	agendaEvents: AgendaData['agendaEvents'];
	deviations: AgendaData['deviations'];
	agreementsMap: AgendaData['agreementsMap'];
	loadData: AgendaData['loadData'];
}

export function useAgendaViewHandlers(input: HandlersInput) {
	const { ui, canEdit, user, agendaEvents, deviations, agreementsMap, loadData } = input;

	const reloadAgenda = useCallback(() => loadData(false), [loadData]);

	const handleEventDrop = useCallback(
		(
			args: { event: CalendarEvent; start: Date; end: Date },
			scope: RecurrenceScope = 'single',
			skipRecurrencePrompt = false,
		) =>
			executeAgendaEventDrop({
				args,
				scope,
				skipRecurrencePrompt,
				canEdit,
				user,
				agendaEvents,
				deviations,
				agreementsMap,
				reloadAgenda,
				ui,
			}),
		[canEdit, user, agendaEvents, deviations, agreementsMap, reloadAgenda, ui],
	);

	const handleCancelLesson = useCallback(
		async (
			scope: RecurrenceScope = 'single',
			cancellationType?: CancellationType,
			cancelledParticipantIds?: string[] | null,
		) => {
			if (!ui.selectedEvent || !user) return;
			ui.setIsCancelling(true);
			const result = await cancelLesson({
				selectedEvent: ui.selectedEvent,
				user,
				agendaEvents,
				agreementsMap,
				scope,
				cancellationType,
				cancelledParticipantIds,
			});
			if (!result.ok) {
				toast.error(result.message);
				ui.setIsCancelling(false);
				return;
			}
			toast.success(result.message);
			ui.setFormDialogOpen(false);
			ui.setSelectedEvent(null);
			ui.setCancelLessonConfirmOpen(false);
			ui.setIsCancelling(false);
			loadData(false);
		},
		[ui, user, agendaEvents, agreementsMap, loadData],
	);

	const handleSelectEvent = useCallback(
		async (event: CalendarEvent) => {
			const eventId = event.resource?.eventId;
			if (!eventId) return;
			ui.setSelectedEvent(event);
			const { data } = await supabase.from('agenda_events').select('*').eq('id', eventId).single();
			if (data) {
				ui.openingForEditRef.current = true;
				ui.setEditingEvent(data as AgendaEventRow);
				ui.setFormDialogOpen(true);
			}
		},
		[ui],
	);

	const handleSelectSlot = useCallback(
		(slotInfo: { start: Date; end: Date }) => {
			ui.setNewEventSlot({ start: slotInfo.start, end: slotInfo.end });
			ui.setEditingEvent(null);
			ui.setFormDialogOpen(true);
		},
		[ui],
	);

	return {
		reloadAgenda,
		handleEventDrop,
		handleCancelLesson,
		handleSelectEvent,
		handleSelectSlot,
	};
}
