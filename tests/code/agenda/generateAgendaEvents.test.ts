import { describe, expect, it } from 'bun:test';
import { generateAgendaEvents } from '../../../src/lib/agenda/eventGenerators';
import { formatAgendaEventSaveError } from '../../../src/lib/agenda/formatAgendaEventSaveError';
import { formatDateToDb } from '../../../src/lib/date/date-format';
import type { AgendaEventRow } from '../../../src/types/agenda-events';

function mockAgendaEvent(overrides: Partial<AgendaEventRow> = {}): AgendaEventRow {
	return {
		id: 'event-1',
		title: 'Proefles',
		description: null,
		start_date: '2025-02-17',
		start_time: '14:00:00',
		end_date: '2025-02-17',
		end_time: '15:00:00',
		is_all_day: false,
		recurring: false,
		recurring_frequency: null,
		recurring_end_date: null,
		color: null,
		source_type: 'manual',
		source_id: null,
		owner_user_id: 'user-1',
		created_by: null,
		updated_by: null,
		created_at: '2025-01-01T00:00:00Z',
		updated_at: '2025-01-01T00:00:00Z',
		...overrides,
	};
}

describe('generateAgendaEvents', () => {
	it('returns a single non-recurring event inside the range', () => {
		const rangeStart = new Date('2025-02-01T00:00:00');
		const rangeEnd = new Date('2025-02-28T23:59:59');
		const events = generateAgendaEvents([mockAgendaEvent()], rangeStart, rangeEnd, new Map());

		expect(events).toHaveLength(1);
		expect(events[0]?.title).toBe('Proefles');
		expect(formatDateToDb(events[0]?.start as Date)).toBe('2025-02-17');
	});

	it('skips non-recurring events outside the range', () => {
		const rangeStart = new Date('2025-03-01T00:00:00');
		const rangeEnd = new Date('2025-03-31T23:59:59');
		const events = generateAgendaEvents([mockAgendaEvent()], rangeStart, rangeEnd, new Map());

		expect(events).toHaveLength(0);
	});

	it('generates weekly recurring events in range', () => {
		const rangeStart = new Date('2025-02-01T00:00:00');
		const rangeEnd = new Date('2025-02-28T23:59:59');
		const events = generateAgendaEvents(
			[
				mockAgendaEvent({
					recurring: true,
					recurring_frequency: 'weekly',
					recurring_end_date: '2025-02-28',
				}),
			],
			rangeStart,
			rangeEnd,
			new Map(),
		);

		expect(events).toHaveLength(2);
		expect(formatDateToDb(events[0]?.start as Date)).toBe('2025-02-17');
		expect(formatDateToDb(events[1]?.start as Date)).toBe('2025-02-24');
	});
});

describe('formatAgendaEventSaveError', () => {
	it('returns Dutch message for no-change saves', () => {
		expect(formatAgendaEventSaveError(new Error('NO_CHANGES'))).toBe('Er zijn geen wijzigingen om op te slaan.');
	});

	it('returns permission message for row-level security errors', () => {
		expect(formatAgendaEventSaveError(new Error('row-level security policy'))).toBe(
			'Je hebt geen toestemming om deze deelnemer toe te voegen',
		);
	});

	it('falls back to default message', () => {
		expect(formatAgendaEventSaveError(new Error('unknown'))).toBe('unknown');
		expect(formatAgendaEventSaveError(null)).toBe('Opslaan mislukt');
	});
});
