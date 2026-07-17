import { addDaysToDateStr } from '@/lib/date/date-format';
import type { DeleteScope } from '@/types/agenda-events';

export type DeleteAgendaEventPlan =
	| { kind: 'all' }
	| { kind: 'single'; occurrenceDate: string }
	| { kind: 'thisAndFuture'; occurrenceDate: string; recurringEndDate: string }
	| { kind: 'invalid' };

export function resolveDeleteAgendaEventPlan(scope: DeleteScope, occurrenceDate?: string): DeleteAgendaEventPlan {
	if (scope === 'all') return { kind: 'all' };
	if (scope === 'single' && occurrenceDate) return { kind: 'single', occurrenceDate };
	if (scope === 'thisAndFuture' && occurrenceDate) {
		return { kind: 'thisAndFuture', occurrenceDate, recurringEndDate: addDaysToDateStr(occurrenceDate, -1) };
	}
	return { kind: 'invalid' };
}

export function getDeleteAgendaEventSuccessMessage(plan: DeleteAgendaEventPlan): string {
	if (plan.kind === 'all') return 'Alle afspraken verwijderd';
	if (plan.kind === 'single') return 'Afspraak geannuleerd';
	if (plan.kind === 'thisAndFuture') return 'Deze en toekomstige afspraken verwijderd';
	return 'Ongeldige verwijderactie';
}

export function buildCancelledDeviationUpsert(
	eventId: string,
	occurrenceDate: string,
	startTime: string,
): {
	event_id: string;
	original_date: string;
	original_start_time: string;
	actual_date: string;
	actual_start_time: string;
	is_cancelled: boolean;
} {
	return {
		event_id: eventId,
		original_date: occurrenceDate,
		original_start_time: startTime,
		actual_date: occurrenceDate,
		actual_start_time: startTime,
		is_cancelled: true,
	};
}

export function isDeleteAgendaEventFetchMissing(
	fetchErr: unknown,
	eventData: { start_time: string } | null | undefined,
): eventData is null | undefined {
	return !!fetchErr || !eventData;
}
