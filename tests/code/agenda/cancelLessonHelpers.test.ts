import { describe, expect, it } from 'bun:test';
import type { CalendarEvent } from '../../../src/components/agenda/types';
import {
	buildCancelLessonDeviationInsert,
	buildDeviationPayload,
	cancelLessonSuccessMessage,
	isPartialCancellation,
	resolveCancelLessonOperation,
	resolveOriginalOccurrence,
	shouldRestoreCancelledLesson,
} from '../../../src/lib/agenda/cancelLessonHelpers';

const selectedEvent = {
	start: new Date('2026-09-07T09:00:00'),
	resource: {
		originalDate: '2026-09-07',
		originalStartTime: '09:00:00',
		isCancelled: true,
		deviationId: 'dev-1',
	},
} as CalendarEvent;

describe('resolveOriginalOccurrence', () => {
	it('uses resource original date and time when present', () => {
		expect(resolveOriginalOccurrence(selectedEvent, '10:00:00')).toEqual({
			originalDateStr: '2026-09-07',
			originalStartTime: '09:00:00',
		});
	});
});

describe('isPartialCancellation', () => {
	it('returns true when participant ids are provided', () => {
		expect(isPartialCancellation(['student-1'])).toBe(true);
	});

	it('returns false when participant ids are empty', () => {
		expect(isPartialCancellation([])).toBe(false);
	});
});

describe('shouldRestoreCancelledLesson', () => {
	it('returns true for cancelled deviation without partial cancel', () => {
		expect(shouldRestoreCancelledLesson(true, 'dev-1', false)).toBe(true);
	});

	it('returns false for partial cancellation', () => {
		expect(shouldRestoreCancelledLesson(true, 'dev-1', true)).toBe(false);
	});
});

describe('buildDeviationPayload', () => {
	it('marks whole lesson as cancelled', () => {
		expect(
			buildDeviationPayload(
				{ originalDateStr: '2026-09-07', originalStartTime: '09:00:00' },
				false,
				'teacher',
				true,
				false,
				null,
			),
		).toEqual({
			is_cancelled: true,
			actual_date: '2026-09-07',
			actual_start_time: '09:00:00',
			spans_future_occurrences: false,
			cancellation_type: 'teacher',
			needs_reschedule: true,
			cancelled_participant_ids: null,
		});
	});

	it('stores partial participant cancellation', () => {
		expect(
			buildDeviationPayload(
				{ originalDateStr: '2026-09-07', originalStartTime: '09:00:00' },
				true,
				'student',
				false,
				true,
				['student-1'],
			),
		).toEqual({
			is_cancelled: false,
			actual_date: '2026-09-07',
			actual_start_time: '09:00:00',
			spans_future_occurrences: true,
			cancellation_type: 'student',
			needs_reschedule: false,
			cancelled_participant_ids: ['student-1'],
		});
	});
});

describe('cancelLessonSuccessMessage', () => {
	it('returns participant message for partial cancel', () => {
		expect(cancelLessonSuccessMessage(true)).toBe('Deelnemer(s) geannuleerd');
	});

	it('returns lesson message for full cancel', () => {
		expect(cancelLessonSuccessMessage(false)).toBe('Les geannuleerd');
	});
});

describe('resolveCancelLessonOperation', () => {
	it('returns restore when a cancelled deviation should be restored', () => {
		expect(resolveCancelLessonOperation(true, 'dev-1')).toBe('restore');
	});

	it('returns update when an existing deviation should be updated', () => {
		expect(resolveCancelLessonOperation(false, 'dev-1')).toBe('update');
	});

	it('returns insert when no deviation exists yet', () => {
		expect(resolveCancelLessonOperation(false, undefined)).toBe('insert');
	});
});

describe('buildCancelLessonDeviationInsert', () => {
	it('combines event id, occurrence, and payload', () => {
		expect(
			buildCancelLessonDeviationInsert(
				'event-1',
				{ originalDateStr: '2026-09-07', originalStartTime: '09:00:00' },
				{
					is_cancelled: true,
					actual_date: '2026-09-07',
					actual_start_time: '09:00:00',
					spans_future_occurrences: false,
					cancellation_type: 'teacher',
					needs_reschedule: true,
					cancelled_participant_ids: null,
				},
			),
		).toEqual({
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
		});
	});
});
