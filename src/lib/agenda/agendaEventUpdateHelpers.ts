import type { AgendaEventInsert, AgendaEventRow } from '@/types/agenda-events';

export interface AgendaEventUpdateFields {
	start_date: string;
	start_time: string;
	end_date: string;
	end_time: string | null;
}

export function resolveAgendaEventUpdateFields(
	inputScope: 'single' | 'thisAndFuture' | 'all',
	occurrenceDate: string | null | undefined,
	event: AgendaEventRow,
	payload: AgendaEventInsert,
): AgendaEventUpdateFields {
	const useEventBase = inputScope === 'all' && !!occurrenceDate;
	return {
		start_date: useEventBase ? event.start_date : payload.start_date,
		start_time: useEventBase ? event.start_time : payload.start_time,
		end_date: useEventBase ? (event.end_date ?? event.start_date) : (payload.end_date ?? payload.start_date),
		end_time: useEventBase ? (event.end_time ?? event.start_time) : (payload.end_time ?? null),
	};
}
