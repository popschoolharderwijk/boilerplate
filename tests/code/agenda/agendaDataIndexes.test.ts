import { describe, expect, it } from 'bun:test';
import { buildDeviationsByEventId, buildRecurringByEventId } from '../../../src/lib/agenda/agendaDataIndexes';
import type { AgendaEventDeviationRow } from '../../../src/types/agenda-events';

const deviations: AgendaEventDeviationRow[] = [
	{
		id: 'd-1',
		event_id: 'event-1',
		original_date: '2026-01-10',
		spans_future_occurrences: false,
	} as AgendaEventDeviationRow,
	{
		id: 'd-2',
		event_id: 'event-1',
		original_date: '2026-02-10',
		spans_future_occurrences: true,
	} as AgendaEventDeviationRow,
	{
		id: 'd-3',
		event_id: 'event-1',
		original_date: '2026-03-10',
		spans_future_occurrences: true,
	} as AgendaEventDeviationRow,
];

describe('buildDeviationsByEventId', () => {
	it('indexes deviations by event and original date', () => {
		const map = buildDeviationsByEventId(deviations);
		expect(map.get('event-1')?.get('2026-01-10')?.id).toBe('d-1');
		expect(map.get('event-1')?.get('2026-02-10')?.id).toBe('d-2');
	});
});

describe('buildRecurringByEventId', () => {
	it('groups and sorts recurring deviations newest first', () => {
		const map = buildRecurringByEventId(deviations);
		expect(map.get('event-1')?.map((d) => d.id)).toEqual(['d-3', 'd-2']);
	});
});
