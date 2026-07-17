import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { AgendaEventFormSaveInput } from '../../../src/lib/agenda/agendaEventFormSave';
import type { AgendaEventRow } from '../../../src/types/agenda-events';

type TableResult = { data?: unknown; error?: { message: string } | null };

type RecordedCall =
	| { kind: 'insert'; table: string; payload: unknown }
	| { kind: 'update'; table: string; payload: unknown; filters: Record<string, unknown> }
	| { kind: 'upsert'; table: string; payload: unknown }
	| { kind: 'delete'; table: string; filters: Record<string, unknown> }
	| { kind: 'select'; table: string; filters: Record<string, unknown> };

const recordedCalls: RecordedCall[] = [];
let tableResults: Record<string, TableResult> = {};
let nextInsertId = 'new-event-1';

function resolveResult(table: string, kind: string): TableResult {
	const key = `${table}:${kind}`;
	return tableResults[key] ?? { data: kind === 'insert' ? { id: nextInsertId } : null, error: null };
}

function createQueryBuilder(table: string) {
	let operation = '';
	let payload: unknown;
	const filters: Record<string, unknown> = {};

	const execute = (): TableResult => {
		switch (operation) {
			case 'insert':
				recordedCalls.push({ kind: 'insert', table, payload });
				return resolveResult(table, 'insert');
			case 'update':
				recordedCalls.push({ kind: 'update', table, payload, filters });
				return resolveResult(table, 'update');
			case 'upsert':
				recordedCalls.push({ kind: 'upsert', table, payload });
				return resolveResult(table, 'upsert');
			case 'delete':
				recordedCalls.push({ kind: 'delete', table, filters });
				return resolveResult(table, 'delete');
			case 'select':
				recordedCalls.push({ kind: 'select', table, filters });
				return resolveResult(table, 'select');
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
			if (!operation) {
				operation = 'select';
			}
			return this;
		}
		eq(col: string, val: unknown) {
			filters[col] = val;
			return this;
		}
		single() {
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
};

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: supabaseMock,
}));

function mockExistingEvent(overrides: Partial<AgendaEventRow> = {}): AgendaEventRow {
	return {
		id: 'event-1',
		title: 'Weekly lesson',
		description: 'Original description',
		start_date: '2025-02-17',
		start_time: '14:00:00',
		end_date: '2025-02-17',
		end_time: '15:00:00',
		is_all_day: false,
		recurring: true,
		recurring_frequency: 'weekly',
		recurring_end_date: '2025-03-31',
		color: '#111111',
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

function baseInput(overrides: Partial<AgendaEventFormSaveInput> = {}): AgendaEventFormSaveInput {
	return {
		userId: 'user-1',
		startDate: '2025-03-01',
		startTime: '14:00',
		endDate: '2025-03-01',
		endTime: '15:00',
		isAllDay: false,
		recurring: false,
		recurringFrequency: 'weekly',
		recurringEndDate: null,
		color: '#ff0000',
		title: 'New event',
		description: 'Description',
		participantIds: ['participant-1'],
		initialParticipantIds: ['participant-1'],
		event: null,
		occurrenceDate: null,
		occurrenceStartTime: null,
		externalSourceType: undefined,
		externalSourceId: undefined,
		scope: 'single',
		...overrides,
	};
}

describe('saveAgendaEventForm', () => {
	let saveAgendaEventForm: typeof import('../../../src/lib/agenda/agendaEventFormSave').saveAgendaEventForm;

	beforeAll(async () => {
		({ saveAgendaEventForm } = await import('../../../src/lib/agenda/agendaEventFormSave'));
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
		nextInsertId = 'new-event-1';
	});

	it('inserts a new event and its participants', async () => {
		await saveAgendaEventForm(baseInput());
		expect(recordedCalls).toHaveLength(2);
		expect(recordedCalls[0]).toEqual({
			kind: 'insert',
			table: 'agenda_events',
			payload: {
				source_type: 'manual',
				source_id: null,
				owner_user_id: 'user-1',
				title: 'New event',
				description: 'Description',
				start_date: '2025-03-01',
				start_time: '14:00',
				end_date: '2025-03-01',
				end_time: '15:00',
				is_all_day: false,
				recurring: false,
				recurring_frequency: null,
				recurring_end_date: null,
				color: '#ff0000',
			},
		});
		expect(recordedCalls[1]).toEqual({
			kind: 'insert',
			table: 'agenda_participants',
			payload: { event_id: 'new-event-1', user_id: 'participant-1' },
		});
	});

	it('upserts a single-occurrence deviation when the title changes', async () => {
		await saveAgendaEventForm(
			baseInput({
				event: mockExistingEvent(),
				scope: 'single',
				occurrenceDate: '2025-02-17',
				occurrenceStartTime: '14:00:00',
				title: 'Changed title',
			}),
		);
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			kind: 'upsert',
			table: 'agenda_event_deviations',
			payload: {
				event_id: 'event-1',
				original_date: '2025-02-17',
				original_start_time: '14:00:00',
				actual_date: '2025-03-01',
				actual_start_time: '14:00:00',
				spans_future_occurrences: false,
				is_cancelled: false,
				title: 'Changed title',
				description: 'Description',
				color: '#ff0000',
				participant_ids: null,
			},
		});
	});

	it('throws NO_CHANGES when a single occurrence has no edits', async () => {
		await expect(
			saveAgendaEventForm(
				baseInput({
					event: mockExistingEvent(),
					scope: 'single',
					occurrenceDate: '2025-02-17',
					occurrenceStartTime: '14:00:00',
					startDate: '2025-02-17',
					startTime: '14:00',
					title: 'Weekly lesson',
					description: 'Original description',
					color: '#111111',
				}),
			),
		).rejects.toThrow('NO_CHANGES');
		expect(recordedCalls).toHaveLength(0);
	});

	it('splits the series for thisAndFuture scope', async () => {
		nextInsertId = 'split-event-1';
		await saveAgendaEventForm(
			baseInput({
				event: mockExistingEvent(),
				scope: 'thisAndFuture',
				occurrenceDate: '2025-03-03',
				recurring: true,
				recurringFrequency: 'weekly',
				recurringEndDate: '2025-03-31',
			}),
		);
		expect(recordedCalls).toHaveLength(3);
		expect(recordedCalls[0]).toEqual({
			kind: 'update',
			table: 'agenda_events',
			payload: { recurring_end_date: '2025-03-02' },
			filters: { id: 'event-1' },
		});
		expect(recordedCalls[1]).toEqual({
			kind: 'insert',
			table: 'agenda_events',
			payload: {
				source_type: 'manual',
				source_id: null,
				owner_user_id: 'user-1',
				title: 'New event',
				description: 'Description',
				start_date: '2025-03-03',
				start_time: '14:00',
				end_date: '2025-03-03',
				end_time: '15:00',
				is_all_day: false,
				recurring: true,
				recurring_frequency: 'weekly',
				recurring_end_date: '2025-03-31',
				color: '#ff0000',
			},
		});
		expect(recordedCalls[2]).toEqual({
			kind: 'insert',
			table: 'agenda_participants',
			payload: { event_id: 'split-event-1', user_id: 'participant-1' },
		});
	});

	it('updates the entire series and syncs participants for scope all', async () => {
		tableResults['agenda_participants:select'] = {
			data: [{ user_id: 'participant-1' }, { user_id: 'participant-2' }],
			error: null,
		};
		await saveAgendaEventForm(
			baseInput({
				event: mockExistingEvent(),
				scope: 'all',
				occurrenceDate: '2025-02-17',
				participantIds: ['participant-1', 'participant-3'],
				initialParticipantIds: ['participant-1'],
			}),
		);
		const updateCalls = recordedCalls.filter((call) => call.kind === 'update');
		const deleteCalls = recordedCalls.filter((call) => call.kind === 'delete');
		const insertCalls = recordedCalls.filter((call) => call.kind === 'insert');
		expect(updateCalls).toHaveLength(2);
		expect(updateCalls[0]?.table).toBe('agenda_events');
		expect(updateCalls[1]).toEqual({
			kind: 'update',
			table: 'agenda_event_deviations',
			payload: {
				title: 'New event',
				description: 'Description',
				color: '#ff0000',
				participant_ids: ['participant-1', 'participant-3'],
			},
			filters: { event_id: 'event-1' },
		});
		expect(deleteCalls).toHaveLength(1);
		expect(deleteCalls[0]).toEqual({
			kind: 'delete',
			table: 'agenda_participants',
			filters: { event_id: 'event-1', user_id: 'participant-2' },
		});
		expect(insertCalls).toHaveLength(1);
		expect(insertCalls[0]).toEqual({
			kind: 'insert',
			table: 'agenda_participants',
			payload: { event_id: 'event-1', user_id: 'participant-3' },
		});
	});
});
