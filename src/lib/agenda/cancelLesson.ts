import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import { supabase } from '@/integrations/supabase/client';
import { getAgendaLessonContext, lookupAgendaEvent } from '@/lib/agenda/agendaEventLookup';
import {
	buildCancelLessonDeviationInsert,
	buildDeviationPayload,
	cancelLessonSuccessMessage,
	isPartialCancellation,
	resolveCancelLessonOperation,
	resolveOriginalOccurrence,
	shouldRestoreCancelledLesson,
} from '@/lib/agenda/cancelLessonHelpers';
import type { AgendaAgreementLike } from '@/lib/agenda/moveAgendaEvent';
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
	const occurrence = resolveOriginalOccurrence(selectedEvent, baseStartTime);
	const isPartialCancel = isPartialCancellation(cancelledParticipantIds);
	const isExistingDeviation = selectedEvent.resource.deviationId;

	const shouldRestore = shouldRestoreCancelledLesson(
		selectedEvent.resource.isCancelled,
		isExistingDeviation,
		isPartialCancel,
	);
	const operation = resolveCancelLessonOperation(shouldRestore, isExistingDeviation);

	if (operation === 'restore') {
		const deviationId = selectedEvent.resource.deviationId;
		if (!deviationId) return { ok: false, message: 'Fout bij herstellen les' };
		const { error } = await supabase.from('agenda_event_deviations').delete().eq('id', deviationId);
		if (error) return { ok: false, message: 'Fout bij herstellen les' };
		return { ok: true, message: 'Les hersteld' };
	}

	const payload = buildDeviationPayload(
		occurrence,
		recurring,
		cancellationType,
		needsReschedule,
		isPartialCancel,
		cancelledParticipantIds ?? null,
	);

	if (operation === 'update') {
		const deviationId = selectedEvent.resource.deviationId;
		if (!deviationId) return { ok: false, message: 'Fout bij annuleren les' };
		const { error } = await supabase.from('agenda_event_deviations').update(payload).eq('id', deviationId);
		if (error) return { ok: false, message: 'Fout bij annuleren les' };
		return { ok: true, message: cancelLessonSuccessMessage(isPartialCancel) };
	}

	const { error } = await supabase
		.from('agenda_event_deviations')
		.insert(buildCancelLessonDeviationInsert(agendaEvent.id, occurrence, payload));
	if (error) return { ok: false, message: 'Fout bij annuleren les' };
	return { ok: true, message: cancelLessonSuccessMessage(isPartialCancel) };
}
