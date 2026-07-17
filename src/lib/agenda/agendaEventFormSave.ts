import { supabase } from '@/integrations/supabase/client';
import { resolveAgendaEventUpdateFields } from '@/lib/agenda/agendaEventUpdateHelpers';
import { addDaysToDateStr } from '@/lib/date/date-format';
import { normalizeTime } from '@/lib/time/time-format';
import type { AgendaEventInsert, AgendaEventRow, AgendaEventSourceType } from '@/types/agenda-events';
import type { LessonFrequency } from '@/types/lesson-agreements';

export { formatAgendaEventSaveError } from './formatAgendaEventSaveError';

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

function buildAgendaEventPayload(input: AgendaEventFormSaveInput): AgendaEventInsert {
	const resolvedSourceType = input.externalSourceType ?? input.event?.source_type ?? 'manual';
	const resolvedSourceId = input.externalSourceId ?? input.event?.source_id ?? null;
	return {
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
}

async function insertParticipants(eventId: string, participantIds: string[]): Promise<void> {
	for (const pId of participantIds) {
		const { error: pErr } = await supabase.from('agenda_participants').insert({ event_id: eventId, user_id: pId });
		if (pErr) throw pErr;
	}
}

async function insertNewAgendaEvent(input: AgendaEventFormSaveInput, payload: AgendaEventInsert): Promise<void> {
	const { data: inserted, error: insertError } = await supabase
		.from('agenda_events')
		.insert(payload)
		.select('id')
		.single();
	if (insertError) throw insertError;
	const eventId = inserted?.id;
	if (!eventId) return;
	await insertParticipants(eventId, input.participantIds);
}

function assertSingleOccurrenceHasChanges(
	input: AgendaEventFormSaveInput,
	event: AgendaEventRow,
): {
	originalStartTime: string;
	actualStartTime: string;
	actualDate: string;
	hasTitleChange: boolean;
	hasDescriptionChange: boolean;
	hasColorChange: boolean;
	hasParticipantChange: boolean;
} {
	const originalStartTime = normalizeTime((input.occurrenceStartTime ?? event.start_time).toString().slice(0, 5));
	const actualStartTime = normalizeTime(input.startTime);
	const actualDate = input.startDate ?? input.occurrenceDate;
	if (!actualDate) throw new Error('NO_CHANGES');
	const sortedCurrent = [...input.participantIds].sort();
	const sortedInitial = [...input.initialParticipantIds].sort();
	const hasDateOrTimeChange = actualDate !== input.occurrenceDate || actualStartTime !== originalStartTime;
	const hasTitleChange = input.title.trim() !== event.title;
	const hasDescriptionChange = (input.description ?? '') !== (event.description ?? '');
	const hasColorChange = (input.color ?? null) !== (event.color ?? null);
	const hasParticipantChange =
		sortedCurrent.length !== sortedInitial.length || sortedCurrent.some((id, i) => id !== sortedInitial[i]);
	if (!hasDateOrTimeChange && !hasTitleChange && !hasDescriptionChange && !hasColorChange && !hasParticipantChange) {
		throw new Error('NO_CHANGES');
	}
	return {
		originalStartTime,
		actualStartTime,
		actualDate,
		hasTitleChange,
		hasDescriptionChange,
		hasColorChange,
		hasParticipantChange,
	};
}

async function saveSingleOccurrenceDeviation(
	input: AgendaEventFormSaveInput,
	event: AgendaEventRow,
	occurrenceDate: string,
): Promise<void> {
	const changes = assertSingleOccurrenceHasChanges(input, event);
	const { error } = await supabase.from('agenda_event_deviations').upsert(
		{
			event_id: event.id,
			original_date: occurrenceDate,
			original_start_time: changes.originalStartTime,
			actual_date: changes.actualDate,
			actual_start_time: changes.actualStartTime,
			spans_future_occurrences: false,
			is_cancelled: false,
			title: changes.hasTitleChange ? input.title.trim() : null,
			description: changes.hasDescriptionChange ? input.description?.trim() || null : null,
			color: changes.hasColorChange ? (input.color ?? null) : null,
			participant_ids: changes.hasParticipantChange ? input.participantIds : null,
		},
		{ onConflict: 'event_id,original_date' },
	);
	if (error) throw error;
}

async function splitSeriesThisAndFuture(
	input: AgendaEventFormSaveInput,
	event: AgendaEventRow,
	payload: AgendaEventInsert,
	occurrenceDate: string,
): Promise<void> {
	const newEndDate = addDaysToDateStr(occurrenceDate, -1);
	const { error: endErr } = await supabase
		.from('agenda_events')
		.update({ recurring_end_date: newEndDate })
		.eq('id', event.id);
	if (endErr) throw endErr;
	const { data: inserted, error: insertError } = await supabase
		.from('agenda_events')
		.insert({ ...payload, start_date: occurrenceDate, end_date: occurrenceDate })
		.select('id')
		.single();
	if (insertError) throw insertError;
	const newEventId = inserted?.id;
	if (newEventId) await insertParticipants(newEventId, input.participantIds);
}

async function syncParticipants(eventId: string, participantIds: string[]): Promise<void> {
	const { data: existing } = await supabase.from('agenda_participants').select('user_id').eq('event_id', eventId);
	const existingIds = new Set((existing ?? []).map((p) => p.user_id));
	for (const id of participantIds.filter((pid) => !existingIds.has(pid))) {
		const { error: addErr } = await supabase.from('agenda_participants').insert({ event_id: eventId, user_id: id });
		if (addErr) throw addErr;
	}
	for (const id of [...existingIds].filter((pid) => !participantIds.includes(pid))) {
		await supabase.from('agenda_participants').delete().eq('event_id', eventId).eq('user_id', id);
	}
}

async function updateExistingAgendaEvent(
	input: AgendaEventFormSaveInput,
	event: AgendaEventRow,
	payload: AgendaEventInsert,
): Promise<void> {
	const occurrenceDate = input.occurrenceDate;
	const updateFields = resolveAgendaEventUpdateFields(input.scope, occurrenceDate, event, payload);
	const { error: updateError } = await supabase
		.from('agenda_events')
		.update({
			title: payload.title,
			description: payload.description,
			start_date: updateFields.start_date,
			start_time: updateFields.start_time,
			end_date: updateFields.end_date,
			end_time: updateFields.end_time,
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

	await syncParticipants(event.id, input.participantIds);
}

export async function saveAgendaEventForm(input: AgendaEventFormSaveInput): Promise<void> {
	const payload = buildAgendaEventPayload(input);

	if (!input.event?.id) {
		await insertNewAgendaEvent(input, payload);
		return;
	}

	const event = input.event;
	if (input.scope === 'single' && input.occurrenceDate) {
		await saveSingleOccurrenceDeviation(input, event, input.occurrenceDate);
		return;
	}

	if (input.scope === 'thisAndFuture' && input.occurrenceDate) {
		await splitSeriesThisAndFuture(input, event, payload, input.occurrenceDate);
		return;
	}

	await updateExistingAgendaEvent(input, event, payload);
}
