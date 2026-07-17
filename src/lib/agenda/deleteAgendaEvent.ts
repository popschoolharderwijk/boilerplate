import { supabase } from '@/integrations/supabase/client';
import {
	buildCancelledDeviationUpsert,
	getDeleteAgendaEventSuccessMessage,
	isDeleteAgendaEventFetchMissing,
	resolveDeleteAgendaEventPlan,
} from '@/lib/agenda/deleteAgendaEventHelpers';
import type { DeleteScope } from '@/types/agenda-events';

export interface DeleteAgendaEventParams {
	eventId: string;
	scope: DeleteScope;
	occurrenceDate?: string;
	userId: string;
}

export type DeleteAgendaEventResult = { ok: true; message: string } | { ok: false; message: string };

export async function deleteAgendaEvent(params: DeleteAgendaEventParams): Promise<DeleteAgendaEventResult> {
	const { eventId, scope, occurrenceDate } = params;
	const plan = resolveDeleteAgendaEventPlan(scope, occurrenceDate);

	if (plan.kind === 'all') {
		const { error } = await supabase.from('agenda_events').delete().eq('id', eventId);
		if (error) return { ok: false, message: 'Afspraak verwijderen mislukt' };
		return { ok: true, message: getDeleteAgendaEventSuccessMessage(plan) };
	}

	if (plan.kind === 'single') {
		const { data: eventData, error: fetchErr } = await supabase
			.from('agenda_events')
			.select('start_time')
			.eq('id', eventId)
			.single();
		if (isDeleteAgendaEventFetchMissing(fetchErr, eventData)) {
			return { ok: false, message: 'Afspraak niet gevonden' };
		}
		const { error } = await supabase
			.from('agenda_event_deviations')
			.upsert(buildCancelledDeviationUpsert(eventId, plan.occurrenceDate, eventData.start_time), {
				onConflict: 'event_id,original_date',
			});
		if (error) return { ok: false, message: 'Afspraak annuleren mislukt' };
		return { ok: true, message: getDeleteAgendaEventSuccessMessage(plan) };
	}

	if (plan.kind === 'thisAndFuture') {
		const { error } = await supabase
			.from('agenda_events')
			.update({ recurring_end_date: plan.recurringEndDate })
			.eq('id', eventId);
		if (error) return { ok: false, message: 'Afspraken verwijderen mislukt' };
		return { ok: true, message: getDeleteAgendaEventSuccessMessage(plan) };
	}

	return { ok: false, message: getDeleteAgendaEventSuccessMessage(plan) };
}
