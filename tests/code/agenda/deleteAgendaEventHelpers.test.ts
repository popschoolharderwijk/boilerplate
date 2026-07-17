import { describe, expect, it } from 'bun:test';
import {
	buildCancelledDeviationUpsert,
	getDeleteAgendaEventSuccessMessage,
	isDeleteAgendaEventFetchMissing,
	resolveDeleteAgendaEventPlan,
} from '../../../src/lib/agenda/deleteAgendaEventHelpers';

describe('resolveDeleteAgendaEventPlan', () => {
	it('returns all scope plan', () => {
		expect(resolveDeleteAgendaEventPlan('all')).toEqual({ kind: 'all' });
	});

	it('returns single scope plan with occurrence date', () => {
		expect(resolveDeleteAgendaEventPlan('single', '2026-09-07')).toEqual({
			kind: 'single',
			occurrenceDate: '2026-09-07',
		});
	});

	it('returns thisAndFuture plan with recurring end date', () => {
		expect(resolveDeleteAgendaEventPlan('thisAndFuture', '2026-09-07')).toEqual({
			kind: 'thisAndFuture',
			occurrenceDate: '2026-09-07',
			recurringEndDate: '2026-09-06',
		});
	});

	it('returns invalid plan when occurrence date is missing', () => {
		expect(resolveDeleteAgendaEventPlan('single')).toEqual({ kind: 'invalid' });
	});
});

describe('getDeleteAgendaEventSuccessMessage', () => {
	it('returns message for all scope', () => {
		expect(getDeleteAgendaEventSuccessMessage({ kind: 'all' })).toBe('Alle afspraken verwijderd');
	});

	it('returns message for single scope', () => {
		expect(getDeleteAgendaEventSuccessMessage({ kind: 'single', occurrenceDate: '2026-09-07' })).toBe(
			'Afspraak geannuleerd',
		);
	});

	it('returns message for thisAndFuture scope', () => {
		expect(
			getDeleteAgendaEventSuccessMessage({
				kind: 'thisAndFuture',
				occurrenceDate: '2026-09-07',
				recurringEndDate: '2026-09-06',
			}),
		).toBe('Deze en toekomstige afspraken verwijderd');
	});

	it('returns invalid action message', () => {
		expect(getDeleteAgendaEventSuccessMessage({ kind: 'invalid' })).toBe('Ongeldige verwijderactie');
	});
});

describe('buildCancelledDeviationUpsert', () => {
	it('builds cancelled deviation upsert payload', () => {
		expect(buildCancelledDeviationUpsert('event-1', '2026-09-07', '09:00:00')).toEqual({
			event_id: 'event-1',
			original_date: '2026-09-07',
			original_start_time: '09:00:00',
			actual_date: '2026-09-07',
			actual_start_time: '09:00:00',
			is_cancelled: true,
		});
	});
});

describe('isDeleteAgendaEventFetchMissing', () => {
	it('returns true when fetch returns an error', () => {
		expect(isDeleteAgendaEventFetchMissing({ message: 'not found' }, { start_time: '09:00:00' })).toBe(true);
	});

	it('returns true when fetch returns no data', () => {
		expect(isDeleteAgendaEventFetchMissing(null, null)).toBe(true);
	});

	it('returns false when fetch returns event data', () => {
		expect(isDeleteAgendaEventFetchMissing(null, { start_time: '09:00:00' })).toBe(false);
	});
});
