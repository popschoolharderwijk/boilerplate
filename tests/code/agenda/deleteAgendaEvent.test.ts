import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type TableResult = { data?: unknown; error?: { message: string } | null };

type RecordedCall =
	| { kind: 'update'; table: string; payload: unknown; filters: Record<string, unknown> }
	| { kind: 'upsert'; table: string; payload: unknown }
	| { kind: 'delete'; table: string; filters: Record<string, unknown> };

const recordedCalls: RecordedCall[] = [];
let tableResults: Record<string, TableResult> = {};

function resolveResult(table: string, kind: string): TableResult {
	return tableResults[`${table}:${kind}`] ?? { error: null };
}

function createQueryBuilder(table: string) {
	let operation = '';
	let payload: unknown;
	const filters: Record<string, unknown> = {};

	const execute = (): TableResult => {
		switch (operation) {
			case 'select':
				return resolveResult(table, 'select');
			case 'update':
				recordedCalls.push({ kind: 'update', table, payload, filters });
				return resolveResult(table, 'update');
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
			operation = 'select';
			return this;
		}
		eq(col: string, val: unknown) {
			filters[col] = val;
			return this;
		}
		single() {
			return Promise.resolve(execute());
		}
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

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: (table: string) => createQueryBuilder(table),
	},
}));

describe('deleteAgendaEvent', () => {
	let deleteAgendaEvent: typeof import('../../../src/lib/agenda/deleteAgendaEvent').deleteAgendaEvent;

	beforeAll(async () => {
		({ deleteAgendaEvent } = await import('../../../src/lib/agenda/deleteAgendaEvent'));
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
		tableResults['agenda_events:select'] = { data: { start_time: '09:00:00' }, error: null };
	});

	it('deletes all occurrences when scope is all', async () => {
		const result = await deleteAgendaEvent({ eventId: 'event-1', scope: 'all', userId: 'user-1' });
		expect(result).toEqual({ ok: true, message: 'Alle afspraken verwijderd' });
		expect(recordedCalls[0]).toEqual({
			kind: 'delete',
			table: 'agenda_events',
			filters: { id: 'event-1' },
		});
	});

	it('upserts a cancelled deviation for a single occurrence', async () => {
		const result = await deleteAgendaEvent({
			eventId: 'event-1',
			scope: 'single',
			occurrenceDate: '2026-09-07',
			userId: 'user-1',
		});
		expect(result).toEqual({ ok: true, message: 'Afspraak geannuleerd' });
		expect(recordedCalls[0]).toEqual({
			kind: 'upsert',
			table: 'agenda_event_deviations',
			payload: {
				event_id: 'event-1',
				original_date: '2026-09-07',
				original_start_time: '09:00:00',
				actual_date: '2026-09-07',
				actual_start_time: '09:00:00',
				is_cancelled: true,
			},
		});
	});

	it('returns not found when single scope fetch fails', async () => {
		tableResults['agenda_events:select'] = { data: null, error: { message: 'missing' } };
		const result = await deleteAgendaEvent({
			eventId: 'event-1',
			scope: 'single',
			occurrenceDate: '2026-09-07',
			userId: 'user-1',
		});
		expect(result).toEqual({ ok: false, message: 'Afspraak niet gevonden' });
	});

	it('updates recurring end date for thisAndFuture scope', async () => {
		const result = await deleteAgendaEvent({
			eventId: 'event-1',
			scope: 'thisAndFuture',
			occurrenceDate: '2026-09-07',
			userId: 'user-1',
		});
		expect(result).toEqual({ ok: true, message: 'Deze en toekomstige afspraken verwijderd' });
		expect(recordedCalls[0]).toEqual({
			kind: 'update',
			table: 'agenda_events',
			payload: { recurring_end_date: '2026-09-06' },
			filters: { id: 'event-1' },
		});
	});

	it('returns invalid action when occurrence date is missing', async () => {
		const result = await deleteAgendaEvent({ eventId: 'event-1', scope: 'single', userId: 'user-1' });
		expect(result).toEqual({ ok: false, message: 'Ongeldige verwijderactie' });
	});
});
