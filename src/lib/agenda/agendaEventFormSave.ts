import { supabase } from '@/integrations/supabase/client';
import { addDaysToDateStr } from '@/lib/date/date-format';
import { normalizeTime } from '@/lib/time/time-format';
import type { AgendaEventInsert, AgendaEventRow, AgendaEventSourceType } from '@/types/agenda-events';
import type { LessonFrequency } from '@/types/lesson-agreements';

export interface AgendaEventFormSaveInput {
	userId: string;
	startDate: string;
	startTime: string;
	endDate: string | null;
	endTime: string;
	isAllDay: boolean;
	recurring: boolean;
	recurringFrequency: LessonFrequency;
	recurringEndDate: string | null;
	color: string;
	title: string;
	description: string;
	participantIds: string[];
	initialParticipantIds: string[];
	event: AgendaEventRow | null | undefined;
	occurrenceDate: string | null | undefined;
	occurrenceStartTime: string | null | undefined;
	externalSourceType: AgendaEventSourceType | undefined;
	externalSourceId: string | null | undefined;
	scope: 'single' | 'thisAndFuture' | 'all';
}

export function formatAgendaEventSaveError(err: unknown): string {
	const message = 'Opslaan mislukt';
	const errMessage = err instanceof Error ? err.message : (err as { message?: string })?.message;
	if (errMessage === 'NO_CHANGES') return 'Er zijn geen wijzigingen om op te slaan.';
	if (!errMessage) return message;
	if (errMessage.includes('row-level security')) return 'Je hebt geen toestemming om deze deelnemer toe te voegen';
	return errMessage;
}

export async function saveAgendaEventForm(input: AgendaEventFormSaveInput): Promise<void> {
	const resolvedSourceType = input.externalSourceType ?? input.event?.source_type ?? 'manual';
	const resolvedSourceId = input.externalSourceId ?? input.event?.source_id ?? null;
	const payload: AgendaEventInsert = {
		source_type: resolvedSourceType,
		source_id: resolvedSourceId,
		owner_user_id: input.userId,
		title: input.title.trim(),
		description: input.description.trim() || null,
		start_date: input.startDate,
		start_time: input.startTime + (input.startTime.length === 5 ? '' : ':00'),
		end_date: input.endDate ?? input.startDate,
		end_time: input.isAllDay ? null : input.endTime + (input.endTime.length === 5 ? '' : ':00'),
		is_all_day: input.isAllDay,
		recurring: input.recurring,
		recurring_frequency: input.recurring ? input.recurringFrequency : null,
		recurring_end_date: input.recurring ? input.recurringEndDate : null,
		color: input.color || null,
	};

	if (!input.event?.id) {
		const { data: inserted, error: insertError } = await supabase
			.from('agenda_events')
			.insert(payload)
			.select('id')
			.single();
		if (insertError) throw insertError;
		const eventId = inserted?.id;
		if (!eventId) return;
		for (const pId of input.participantIds) {
			const { error: pErr } = await supabase
				.from('agenda_participants')
				.insert({ event_id: eventId, user_id: pId });
			if (pErr) throw pErr;
		}
		return;
	}

	const event = input.event;
	if (input.scope === 'single' && input.occurrenceDate) {
		const originalStartTime = normalizeTime((input.occurrenceStartTime ?? event.start_time).toString().slice(0, 5));
		const actualStartTime = normalizeTime(input.startTime);
		const actualDate = input.startDate ?? input.occurrenceDate;
		const sortedCurrent = [...input.participantIds].sort();
		const sortedInitial = [...input.initialParticipantIds].sort();
		const hasDateOrTimeChange = actualDate !== input.occurrenceDate || actualStartTime !== originalStartTime;
		const hasTitleChange = input.title.trim() !== event.title;
		const hasDescriptionChange = (input.description ?? '') !== (event.description ?? '');
		const hasColorChange = (input.color ?? null) !== (event.color ?? null);
		const hasParticipantChange =
			sortedCurrent.length !== sortedInitial.length || sortedCurrent.some((id, i) => id !== sortedInitial[i]);
		if (
			!hasDateOrTimeChange &&
			!hasTitleChange &&
			!hasDescriptionChange &&
			!hasColorChange &&
			!hasParticipantChange
		) {
			throw new Error('NO_CHANGES');
		}
		const { error } = await supabase.from('agenda_event_deviations').upsert(
			{
				event_id: event.id,
				original_date: input.occurrenceDate,
				original_start_time: originalStartTime,
				actual_date: actualDate,
				actual_start_time: actualStartTime,
				spans_future_occurrences: false,
				is_cancelled: false,
				title: hasTitleChange ? input.title.trim() : null,
				description: hasDescriptionChange ? input.description?.trim() || null : null,
				color: hasColorChange ? (input.color ?? null) : null,
				participant_ids: hasParticipantChange ? input.participantIds : null,
			},
			{ onConflict: 'event_id,original_date' },
		);
		if (error) throw error;
		return;
	}

	if (input.scope === 'thisAndFuture' && input.occurrenceDate) {
		const newEndDate = addDaysToDateStr(input.occurrenceDate, -1);
		const { error: endErr } = await supabase
			.from('agenda_events')
			.update({ recurring_end_date: newEndDate })
			.eq('id', event.id);
		if (endErr) throw endErr;
		const { data: inserted, error: insertError } = await supabase
			.from('agenda_events')
			.insert({ ...payload, start_date: input.occurrenceDate, end_date: input.occurrenceDate })
			.select('id')
			.single();
		if (insertError) throw insertError;
		const newEventId = inserted?.id;
		if (newEventId) {
			for (const pId of input.participantIds) {
				const { error: pErr } = await supabase
					.from('agenda_participants')
					.insert({ event_id: newEventId, user_id: pId });
				if (pErr) throw pErr;
			}
		}
		return;
	}

	const occurrenceDate = input.occurrenceDate;
	const baseStartDate = input.scope === 'all' && occurrenceDate ? event.start_date : payload.start_date;
	const baseStartTime = input.scope === 'all' && occurrenceDate ? event.start_time : payload.start_time;
	const baseEndDate =
		input.scope === 'all' && occurrenceDate
			? (event.end_date ?? event.start_date)
			: (payload.end_date ?? payload.start_date);
	const baseEndTime =
		input.scope === 'all' && occurrenceDate ? (event.end_time ?? event.start_time) : payload.end_time;
	const { error: updateError } = await supabase
		.from('agenda_events')
		.update({
			title: payload.title,
			description: payload.description,
			start_date: baseStartDate,
			start_time: baseStartTime,
			end_date: baseEndDate,
			end_time: baseEndTime,
			is_all_day: payload.is_all_day,
			recurring: payload.recurring,
			recurring_frequency: payload.recurring_frequency,
			recurring_end_date: payload.recurring_end_date,
			color: payload.color,
		})
		.eq('id', event.id);
	if (updateError) throw updateError;

	if (input.scope === 'all') {
		const { error: devErr } = await supabase
			.from('agenda_event_deviations')
			.update({
				title: payload.title,
				description: payload.description,
				color: payload.color,
				participant_ids: input.participantIds.length > 0 ? input.participantIds : null,
			})
			.eq('event_id', event.id);
		if (devErr) throw devErr;
	}

	const { data: existing } = await supabase.from('agenda_participants').select('user_id').eq('event_id', event.id);
	const existingIds = new Set((existing ?? []).map((p) => p.user_id));
	for (const id of input.participantIds.filter((pid) => !existingIds.has(pid))) {
		const { error: addErr } = await supabase
			.from('agenda_participants')
			.insert({ event_id: event.id, user_id: id });
		if (addErr) throw addErr;
	}
	for (const id of [...existingIds].filter((pid) => !input.participantIds.includes(pid))) {
		await supabase.from('agenda_participants').delete().eq('event_id', event.id).eq('user_id', id);
	}
}
