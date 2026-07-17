import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { CalendarEvent } from '../../../src/components/agenda/types';
import type { CancelLessonParams } from '../../../src/lib/agenda/cancelLesson';
import type { AgendaEventRow } from '../../../src/types/agenda-events';

type TableResult = { data?: unknown; error?: { message: string } | null };

type RecordedCall =
	| { kind: 'update'; table: string; payload: unknown; filters: Record<string, unknown> }
	| { kind: 'insert'; table: string; payload: unknown }
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
			case 'update':
				recordedCalls.push({ kind: 'update', table, payload, filters });
				return resolveResult(table, 'update');
			case 'insert':
				recordedCalls.push({ kind: 'insert', table, payload });
				return resolveResult(table, 'insert');
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
		delete() {
			operation = 'delete';
			return this;
		}
		eq(col: string, val: unknown) {
			filters[col] = val;
			return this;
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

function mockAgendaEvent(): AgendaEventRow {
	return {
		id: 'event-1',
		title: 'Weekly lesson',
		description: null,
		start_date: '2026-09-07',
		start_time: '09:00:00',
		end_date: '2026-09-07',
		end_time: '10:00:00',
		is_all_day: false,
		recurring: true,
		recurring_frequency: 'weekly',
		recurring_end_date: '2026-12-31',
		color: null,
		source_type: 'manual',
		source_id: null,
		owner_user_id: 'user-1',
		created_by: null,
		updated_by: null,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
	};
}

function mockCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		title: 'Weekly lesson',
		start: new Date('2026-09-07T09:00:00'),
		end: new Date('2026-09-07T10:00:00'),
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

function baseParams(overrides: Partial<CancelLessonParams> = {}): CancelLessonParams {
	return {
		selectedEvent: mockCalendarEvent(),
		user: { id: 'user-1' },
		agendaEvents: [mockAgendaEvent()],
		agreementsMap: new Map(),
		scope: 'single',
		...overrides,
	};
}

describe('cancelLesson', () => {
	let cancelLesson: typeof import('../../../src/lib/agenda/cancelLesson').cancelLesson;

	beforeAll(async () => {
		({ cancelLesson } = await import('../../../src/lib/agenda/cancelLesson'));
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
	});

	it('returns an error when the agenda event is missing', async () => {
		const result = await cancelLesson(baseParams({ agendaEvents: [] }));
		expect(result).toEqual({ ok: false, message: 'Afspraak niet gevonden' });
		expect(recordedCalls).toHaveLength(0);
	});

	it('inserts a deviation when cancelling a new occurrence', async () => {
		const result = await cancelLesson(baseParams({ cancellationType: 'teacher' }));
		expect(result).toEqual({ ok: true, message: 'Les geannuleerd' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			kind: 'insert',
			table: 'agenda_event_deviations',
			payload: {
				event_id: 'event-1',
				original_date: '2026-09-07',
				original_start_time: '09:00:00',
				is_cancelled: true,
				actual_date: '2026-09-07',
				actual_start_time: '09:00:00',
				spans_future_occurrences: false,
				cancellation_type: 'teacher',
				needs_reschedule: true,
				cancelled_participant_ids: null,
			},
		});
	});

	it('updates an existing deviation when cancelling again', async () => {
		const result = await cancelLesson(
			baseParams({
				selectedEvent: mockCalendarEvent({
					resource: {
						type: 'agenda',
						agreementId: 'event-1',
						eventId: 'event-1',
						studentName: 'Weekly lesson',
						lessonTypeName: 'Weekly lesson',
						lessonTypeColor: null,
						lessonTypeIcon: null,
						isDeviation: true,
						isCancelled: false,
						isGroupLesson: false,
						sourceType: 'manual',
						deviationId: 'dev-1',
					},
				}),
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Les geannuleerd' });
		expect(recordedCalls[0]?.kind).toBe('update');
	});

	it('restores a cancelled deviation when toggled back', async () => {
		const result = await cancelLesson(
			baseParams({
				selectedEvent: mockCalendarEvent({
					resource: {
						type: 'agenda',
						agreementId: 'event-1',
						eventId: 'event-1',
						studentName: 'Weekly lesson',
						lessonTypeName: 'Weekly lesson',
						lessonTypeColor: null,
						lessonTypeIcon: null,
						isDeviation: true,
						isCancelled: true,
						isGroupLesson: false,
						sourceType: 'manual',
						deviationId: 'dev-1',
					},
				}),
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Les hersteld' });
		expect(recordedCalls[0]).toEqual({
			kind: 'delete',
			table: 'agenda_event_deviations',
			filters: { id: 'dev-1' },
		});
	});

	it('returns partial cancellation message for selected participants', async () => {
		const result = await cancelLesson(
			baseParams({
				cancelledParticipantIds: ['student-1'],
			}),
		);
		expect(result).toEqual({ ok: true, message: 'Deelnemer(s) geannuleerd' });
	});
});
