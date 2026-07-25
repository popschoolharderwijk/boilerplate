import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { CalendarEvent } from '../../../src/components/agenda/types';
import { PostgresErrorCodes } from '../../../src/integrations/supabase/errorcodes';
import type { MoveAgendaEventParams } from '../../../src/lib/agenda/moveAgendaEvent';
import type { AgendaEventDeviationRow, AgendaEventRow } from '../../../src/types/agenda-events';

type TableResult = { data?: unknown; error?: { code?: string; message: string } | null };

type RecordedCall =
	| { kind: 'update'; table: string; payload: unknown; filters: Record<string, unknown> }
	| { kind: 'insert'; table: string; payload: unknown }
	| { kind: 'upsert'; table: string; payload: unknown }
	| { kind: 'delete'; table: string; filters: Record<string, unknown> }
	| { kind: 'rpc'; fn: string; params: unknown };

const recordedCalls: RecordedCall[] = [];
let tableResults: Record<string, TableResult> = {};

function resolveResult(table: string, kind: string): TableResult {
	const key = `${table}:${kind}`;
	return tableResults[key] ?? { error: null };
}

function createQueryBuilder(table: string) {
	let operation = '';
	let payload: unknown;
	const filters: Record<string, unknown> = {};

	const execute = (): TableResult => {
		switch (operation) {
			case 'update':
				recordedCalls.push({ kind: 'update', table, payload, filters });
				return resolveResult(table, 'update');
			case 'insert':
				recordedCalls.push({ kind: 'insert', table, payload });
				return resolveResult(table, 'insert');
			case 'upsert':
				recordedCalls.push({ kind: 'upsert', table, payload });
				return resolveResult(table, 'upsert');
			case 'delete':
				recordedCalls.push({ kind: 'delete', table, filters });
				return resolveResult(table, 'delete');
			default:
				return { error: null };
		}
	};

	class QueryBuilder implements PromiseLike<TableResult> {
		update(nextPayload: unknown) {
			operation = 'update';
			payload = nextPayload;
			return this;
		}
		insert(nextPayload: unknown) {
			operation = 'insert';
			payload = nextPayload;
			return this;
		}
		upsert(nextPayload: unknown, _opts?: unknown) {
			operation = 'upsert';
			payload = nextPayload;
			return this;
		}
		delete() {
			operation = 'delete';
			return this;
		}
		select(_cols?: string) {
			return this;
		}
		eq(col: string, val: unknown) {
			filters[col] = val;
			return this;
		}
		single() {
			return Promise.resolve(execute());
		}
		maybeSingle() {
			return Promise.resolve(execute());
		}
		// Intentionally thenable: mirrors Supabase query builder await without .single()
		// biome-ignore lint/suspicious/noThenProperty: supabase query builder mock
		then<TResult1 = TableResult, TResult2 = never>(
			onFulfilled?: ((value: TableResult) => TResult1 | PromiseLike<TResult1>) | null,
			onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
		) {
			return Promise.resolve(execute()).then(onFulfilled, onRejected);
		}
	}

	return new QueryBuilder();
}

const supabaseMock = {
	from: (table: string) => createQueryBuilder(table),
	rpc: (fn: string, params: unknown) => {
		recordedCalls.push({ kind: 'rpc', fn, params });
		return Promise.resolve(tableResults[`rpc:${fn}`] ?? { data: 'restored', error: null });
	},
};

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: supabaseMock,
}));

function mockAgendaEvent(overrides: Partial<AgendaEventRow> = {}): AgendaEventRow {
	return {
		id: 'event-1',
		title: 'Weekly lesson',
		description: null,
		start_date: '2025-02-17',
		start_time: '14:00:00',
		end_date: '2025-02-17',
		end_time: '15:00:00',
		is_all_day: false,
		recurring: true,
		recurring_frequency: 'weekly',
		recurring_end_date: '2025-03-31',
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

function mockCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		title: 'Weekly lesson',
		start: new Date('2025-02-17T14:00:00'),
		end: new Date('2025-02-17T15:00:00'),
		resource: {
			type: 'agenda',
			agreementId: 'event-1',
			eventId: 'event-1',
			studentName: 'Weekly lesson',
			lessonTypeName: 'Weekly lesson',
			lessonTypeColor: null,
			lessonTypeIcon: null,
			isDeviation: false,
			isCancelled: false,
			isGroupLesson: false,
			sourceType: 'manual',
		},
		...overrides,
	};
}

function mockDeviation(overrides: Partial<AgendaEventDeviationRow> = {}): AgendaEventDeviationRow {
	return {
		id: 'dev-1',
		event_id: 'event-1',
		original_date: '2025-02-17',
		original_start_time: '14:00:00',
		actual_date: '2025-02-18',
		actual_start_time: '15:00:00',
		spans_future_occurrences: false,
		spans_end_date: null,
		is_cancelled: false,
		needs_reschedule: false,
		cancellation_type: null,
		cancelled_participant_ids: null,
		title: null,
		description: null,
		color: null,
		participant_ids: null,
		reason: null,
		created_at: '2025-01-01T00:00:00Z',
		created_by: null,
		updated_at: '2025-01-01T00:00:00Z',
		updated_by: null,
		...overrides,
	};
}

function baseParams(overrides: Partial<MoveAgendaEventParams> = {}): MoveAgendaEventParams {
	return {
		event: mockCalendarEvent(),
		start: new Date('2025-02-18T15:00:00'),
		end: new Date('2025-02-18T16:00:00'),
		scope: 'single',
		user: { id: 'user-1' },
		agendaEvents: [mockAgendaEvent()],
		deviations: [],
		agreementsMap: new Map(),
		...overrides,
	};
}

describe('moveAgendaEvent', () => {
	let moveAgendaEvent: typeof import('../../../src/lib/agenda/moveAgendaEvent').moveAgendaEvent;

	beforeAll(async () => {
		({ moveAgendaEvent } = await import('../../../src/lib/agenda/moveAgendaEvent'));
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
	});

	it('returns an error when the agenda event is missing', async () => {
		const result = await moveAgendaEvent(
			baseParams({
				agendaEvents: [],
			}),
		);
		expect(result).toEqual({ ok: false, message: 'Afspraak niet gevonden' });
		expect(recordedCalls).toHaveLength(0);
	});

	it('updates a non-recurring event', async () => {
		const result = await moveAgendaEvent(
			baseParams({
				agendaEvents: [mockAgendaEvent({ recurring: false })],
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Afspraak verplaatst' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			kind: 'update',
			table: 'agenda_events',
			payload: {
				start_date: '2025-02-18',
				start_time: '15:00:00',
				end_date: '2025-02-18',
				end_time: '16:00:00',
			},
			filters: { id: 'event-1' },
		});
	});

	it('returns an error when a non-recurring update fails', async () => {
		tableResults['agenda_events:update'] = { error: { message: 'db error' } };
		const result = await moveAgendaEvent(
			baseParams({
				agendaEvents: [mockAgendaEvent({ recurring: false })],
			}),
		);
		expect(result).toEqual({ ok: false, message: 'Afspraak verplaatsen mislukt' });
	});

	it('returns a no-op when a recurring event is dropped on the same slot', async () => {
		const result = await moveAgendaEvent(
			baseParams({
				start: new Date('2025-02-17T14:00:00'),
				end: new Date('2025-02-17T15:00:00'),
			}),
		);
		expect(result).toEqual({ ok: true, message: '' });
		expect(recordedCalls).toHaveLength(0);
	});

	it('creates a deviation when a recurring occurrence is moved', async () => {
		const result = await moveAgendaEvent(baseParams());
		expect(result).toEqual({ ok: true, message: 'Afspraak verplaatst' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			kind: 'upsert',
			table: 'agenda_event_deviations',
			payload: {
				event_id: 'event-1',
				original_date: '2025-02-17',
				original_start_time: '14:00:00',
				actual_date: '2025-02-18',
				actual_start_time: '15:00:00',
				spans_future_occurrences: false,
			},
		});
	});

	it('updates an existing deviation when the occurrence is moved again', async () => {
		const deviation = mockDeviation();
		const result = await moveAgendaEvent(
			baseParams({
				start: new Date('2025-02-19T16:00:00'),
				end: new Date('2025-02-19T17:00:00'),
				deviations: [deviation],
				event: mockCalendarEvent({
					resource: {
						type: 'agenda',
						agreementId: 'event-1',
						eventId: 'event-1',
						deviationId: 'dev-1',
						studentName: 'Weekly lesson',
						lessonTypeName: 'Weekly lesson',
						lessonTypeColor: null,
						lessonTypeIcon: null,
						isDeviation: true,
						isCancelled: false,
						isGroupLesson: false,
						sourceType: 'manual',
						originalDate: '2025-02-17',
						originalStartTime: '14:00:00',
					},
				}),
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Afspraak bijgewerkt' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			kind: 'update',
			table: 'agenda_event_deviations',
			payload: {
				actual_date: '2025-02-19',
				actual_start_time: '16:00:00',
				spans_future_occurrences: false,
			},
			filters: { id: 'dev-1' },
		});
	});

	it('restores a moved occurrence via rpc when dropped on the original slot', async () => {
		const deviation = mockDeviation();
		const result = await moveAgendaEvent(
			baseParams({
				start: new Date('2025-02-17T14:00:00'),
				end: new Date('2025-02-17T15:00:00'),
				deviations: [deviation],
				event: mockCalendarEvent({
					resource: {
						type: 'agenda',
						agreementId: 'event-1',
						eventId: 'event-1',
						deviationId: 'dev-1',
						studentName: 'Weekly lesson',
						lessonTypeName: 'Weekly lesson',
						lessonTypeColor: null,
						lessonTypeIcon: null,
						isDeviation: true,
						isCancelled: false,
						isGroupLesson: false,
						sourceType: 'manual',
						originalDate: '2025-02-17',
						originalStartTime: '14:00:00',
					},
				}),
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Afspraak teruggezet naar originele planning' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			kind: 'rpc',
			fn: 'ensure_week_shows_original_slot',
			params: {
				p_event_id: 'event-1',
				p_week_date: '2025-02-17',
				p_scope: 'only_this',
			},
		});
	});

	it('returns an empty message when restoring without an existing deviation', async () => {
		const result = await moveAgendaEvent(
			baseParams({
				start: new Date('2025-02-17T14:00:00'),
				end: new Date('2025-02-17T15:00:00'),
			}),
		);
		expect(result).toEqual({ ok: true, message: '' });
		expect(recordedCalls).toHaveLength(0);
	});

	it('moves the entire series and clears deviations with scope all', async () => {
		const result = await moveAgendaEvent(
			baseParams({
				scope: 'all',
				start: new Date('2025-02-19T16:00:00'),
				end: new Date('2025-02-19T17:00:00'),
				deviations: [],
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Alle afspraken verplaatst' });
		expect(recordedCalls).toHaveLength(2);
		expect(recordedCalls[0]?.kind).toBe('update');
		expect(recordedCalls[1]).toEqual({
			kind: 'delete',
			table: 'agenda_event_deviations',
			filters: { event_id: 'event-1' },
		});
	});

	it('returns a past-date message when creating a deviation fails the date check', async () => {
		tableResults['agenda_event_deviations:upsert'] = {
			error: { code: PostgresErrorCodes.CHECK_VIOLATION, message: 'deviation_date_check failed' },
		};
		const result = await moveAgendaEvent(baseParams());
		expect(result).toEqual({ ok: false, message: 'Afspraak kan niet in het verleden worden geplaatst.' });
	});
});
