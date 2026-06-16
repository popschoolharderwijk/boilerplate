import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import { supabase } from '@/integrations/supabase/client';
import { getAgendaLessonContext, lookupAgendaEvent } from '@/lib/agenda/agendaEventLookup';
import type { AgendaAgreementLike } from '@/lib/agenda/moveAgendaEvent';
import { formatDateToDb, now } from '@/lib/date/date-format';
import { normalizeTime } from '@/lib/time/time-format';
import type { AgendaEventRow, CancellationType } from '@/types/agenda-events';

export interface CancelLessonParams {
	selectedEvent: CalendarEvent;
	user: { id: string };
	agendaEvents: AgendaEventRow[];
	agreementsMap: Map<string, AgendaAgreementLike>;
	scope: RecurrenceScope;
	cancellationType?: CancellationType;
	/** When provided (group lessons): cancel only these participants. Empty/undefined = whole occurrence. */
	cancelledParticipantIds?: string[] | null;
}

export type CancelLessonResult = { ok: true; message: string } | { ok: false; message: string };

export async function cancelLesson(params: CancelLessonParams): Promise<CancelLessonResult> {
	const { selectedEvent, agendaEvents, agreementsMap, scope, cancellationType, cancelledParticipantIds } = params;
	const needsReschedule = cancellationType === 'teacher';
	const lookup = lookupAgendaEvent(selectedEvent.resource.eventId, agendaEvents);
	if ('ok' in lookup) return lookup;
	const agendaEvent = lookup.event;

	const recurring = scope === 'thisAndFuture';
	const { baseStartTime } = getAgendaLessonContext(agendaEvent, agreementsMap);

	const isExistingDeviation = selectedEvent.resource.deviationId;
	let originalDateStr: string;
	let originalStartTime: string;
	if (selectedEvent.resource.originalDate && selectedEvent.resource.originalStartTime) {
		originalDateStr = selectedEvent.resource.originalDate;
		originalStartTime = selectedEvent.resource.originalStartTime;
	} else {
		originalDateStr = selectedEvent.start ? formatDateToDb(selectedEvent.start) : formatDateToDb(now());
		originalStartTime = normalizeTime(baseStartTime);
	}

	const isPartialCancel = !!cancelledParticipantIds && cancelledParticipantIds.length > 0;

	if (selectedEvent.resource.isCancelled && isExistingDeviation && !isPartialCancel) {
		const { error } = await supabase
			.from('agenda_event_deviations')
			.delete()
			.eq('id', selectedEvent.resource.deviationId);
		if (error) return { ok: false, message: 'Fout bij herstellen les' };
		return { ok: true, message: 'Les hersteld' };
	}

	if (isExistingDeviation) {
		const { error } = await supabase
			.from('agenda_event_deviations')
			.update({
				is_cancelled: !isPartialCancel,
				actual_date: originalDateStr,
				actual_start_time: originalStartTime,
				spans_future_occurrences: recurring,
				cancellation_type: cancellationType ?? null,
				needs_reschedule: !isPartialCancel && needsReschedule,
				cancelled_participant_ids: isPartialCancel ? cancelledParticipantIds : null,
			})
			.eq('id', selectedEvent.resource.deviationId);
		if (error) return { ok: false, message: 'Fout bij annuleren les' };
		return { ok: true, message: isPartialCancel ? 'Deelnemer(s) geannuleerd' : 'Les geannuleerd' };
	}

	const { error } = await supabase.from('agenda_event_deviations').insert({
		event_id: agendaEvent.id,
		original_date: originalDateStr,
		original_start_time: originalStartTime,
		actual_date: originalDateStr,
		actual_start_time: originalStartTime,
		is_cancelled: !isPartialCancel,
		spans_future_occurrences: recurring,
		cancellation_type: cancellationType ?? null,
		needs_reschedule: !isPartialCancel && needsReschedule,
		cancelled_participant_ids: isPartialCancel ? cancelledParticipantIds : null,
	});
	if (error) return { ok: false, message: 'Fout bij annuleren les' };
	return { ok: true, message: isPartialCancel ? 'Deelnemer(s) geannuleerd' : 'Les geannuleerd' };
}
