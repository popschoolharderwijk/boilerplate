import type { CalendarEvent } from '@/components/agenda/types';
import { formatDateToDb, now } from '@/lib/date/date-format';
import { normalizeTime } from '@/lib/time/time-format';
import type { CancellationType } from '@/types/agenda-events';

export interface OriginalOccurrence {
	originalDateStr: string;
	originalStartTime: string;
}

export interface DeviationPayload {
	is_cancelled: boolean;
	actual_date: string;
	actual_start_time: string;
	spans_future_occurrences: boolean;
	cancellation_type: CancellationType | null;
	needs_reschedule: boolean;
	cancelled_participant_ids: string[] | null;
}

export function resolveOriginalOccurrence(selectedEvent: CalendarEvent, baseStartTime: string): OriginalOccurrence {
	if (selectedEvent.resource.originalDate && selectedEvent.resource.originalStartTime) {
		return {
			originalDateStr: selectedEvent.resource.originalDate,
			originalStartTime: selectedEvent.resource.originalStartTime,
		};
	}
	return {
		originalDateStr: selectedEvent.start ? formatDateToDb(selectedEvent.start) : formatDateToDb(now()),
		originalStartTime: normalizeTime(baseStartTime),
	};
}

export function isPartialCancellation(cancelledParticipantIds?: string[] | null): boolean {
	return !!cancelledParticipantIds && cancelledParticipantIds.length > 0;
}

export function shouldRestoreCancelledLesson(
	isCancelled: boolean,
	isExistingDeviation: string | undefined,
	isPartialCancel: boolean,
): boolean {
	return isCancelled && !!isExistingDeviation && !isPartialCancel;
}

export function buildDeviationPayload(
	occurrence: OriginalOccurrence,
	recurring: boolean,
	cancellationType: CancellationType | undefined,
	needsReschedule: boolean,
	isPartialCancel: boolean,
	cancelledParticipantIds: string[] | null,
): DeviationPayload {
	return {
		is_cancelled: !isPartialCancel,
		actual_date: occurrence.originalDateStr,
		actual_start_time: occurrence.originalStartTime,
		spans_future_occurrences: recurring,
		cancellation_type: cancellationType ?? null,
		needs_reschedule: !isPartialCancel && needsReschedule,
		cancelled_participant_ids: isPartialCancel ? cancelledParticipantIds : null,
	};
}

export function cancelLessonSuccessMessage(isPartialCancel: boolean): string {
	return isPartialCancel ? 'Deelnemer(s) geannuleerd' : 'Les geannuleerd';
}

export type CancelLessonOperation = 'restore' | 'update' | 'insert';

export function resolveCancelLessonOperation(
	shouldRestore: boolean,
	isExistingDeviation: string | undefined,
): CancelLessonOperation {
	if (shouldRestore) return 'restore';
	if (isExistingDeviation) return 'update';
	return 'insert';
}

export function buildCancelLessonDeviationInsert(
	eventId: string,
	occurrence: OriginalOccurrence,
	payload: DeviationPayload,
): {
	event_id: string;
	original_date: string;
	original_start_time: string;
} & DeviationPayload {
	return {
		event_id: eventId,
		original_date: occurrence.originalDateStr,
		original_start_time: occurrence.originalStartTime,
		...payload,
	};
}
