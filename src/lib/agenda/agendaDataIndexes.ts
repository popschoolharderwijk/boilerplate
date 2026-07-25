import type { AgendaEventDeviationRow } from '@/types/agenda-events';

export function buildDeviationsByEventId(
	deviations: AgendaEventDeviationRow[],
): Map<string, Map<string, AgendaEventDeviationRow>> {
	const deviationsByEventId = new Map<string, Map<string, AgendaEventDeviationRow>>();
	for (const deviation of deviations) {
		let inner = deviationsByEventId.get(deviation.event_id);
		if (!inner) {
			inner = new Map();
			deviationsByEventId.set(deviation.event_id, inner);
		}
		inner.set(deviation.original_date, deviation);
	}
	return deviationsByEventId;
}

export function buildRecurringByEventId(deviations: AgendaEventDeviationRow[]): Map<string, AgendaEventDeviationRow[]> {
	const recurringByEventId = new Map<string, AgendaEventDeviationRow[]>();
	for (const deviation of deviations) {
		if (!deviation.spans_future_occurrences) continue;
		const list = recurringByEventId.get(deviation.event_id) ?? [];
		list.push(deviation);
		recurringByEventId.set(deviation.event_id, list);
	}
	for (const list of recurringByEventId.values()) {
		list.sort((a, b) => b.original_date.localeCompare(a.original_date));
	}
	return recurringByEventId;
}
