import type { CalendarEvent } from '@/components/agenda/types';
import { addMinutes, formatDateToDb } from '@/lib/date/date-format';
import type { AgendaEventDeviationRow, AgendaEventRow } from '@/types/agenda-events';
import type { LessonAgreementWithStudent } from '@/types/lesson-agreements';
import { appendRecurringAgendaEvents } from './recurringAgendaEvents';

export interface NoLessonPeriod {
	start_date: string;
	end_date: string;
	name?: string | null;
}

export function findNoLessonPeriod(date: Date, periods: NoLessonPeriod[] | undefined): NoLessonPeriod | undefined {
	if (!periods?.length) return undefined;
	const dateStr = formatDateToDb(date);
	return periods.find((p) => p.start_date <= dateStr && dateStr <= p.end_date);
}

/**
 * Generate calendar events from agenda_events (manual events). Uses lessonHelpers for recurrence.
 */
export function generateAgendaEvents(
	agendaEvents: AgendaEventRow[],
	rangeStart: Date,
	rangeEnd: Date,
	deviationsByEventId: Map<string, Map<string, AgendaEventDeviationRow>>,
	recurringByEventId?: Map<string, AgendaEventDeviationRow[]>,
	agreementsMap?: Map<string, LessonAgreementWithStudent>,
	noLessonPeriods?: NoLessonPeriod[],
): CalendarEvent[] {
	const events: CalendarEvent[] = [];

	for (const ev of agendaEvents) {
		const eventDeviations = deviationsByEventId.get(ev.id);
		const recurringList = recurringByEventId?.get(ev.id) ?? [];
		const isLessonEvent = ev.source_type === 'lesson_agreement' && !!ev.source_id;
		const agreement = isLessonEvent && agreementsMap ? agreementsMap.get(ev.source_id as string) : null;

		if (!ev.recurring || !ev.recurring_frequency) {
			pushSingleAgendaEvent(events, ev, rangeStart, rangeEnd, isLessonEvent);
			continue;
		}

		appendRecurringAgendaEvents(
			ev,
			events,
			rangeStart,
			rangeEnd,
			eventDeviations,
			recurringList,
			agreement ?? null,
			isLessonEvent,
			ev.source_type === 'lesson_agreement' || ev.source_type === 'lesson_group',
			noLessonPeriods,
		);
	}

	return events;
}

function pushSingleAgendaEvent(
	events: CalendarEvent[],
	ev: AgendaEventRow,
	rangeStart: Date,
	rangeEnd: Date,
	isLessonEvent: boolean,
): void {
	const start = new Date(`${ev.start_date}T${ev.start_time}`);
	const end = ev.end_time ? new Date(`${ev.end_date ?? ev.start_date}T${ev.end_time}`) : addMinutes(start, 60);
	if (start < rangeStart || start > rangeEnd) return;
	events.push({
		title: ev.title,
		start,
		end,
		resource: {
			type: 'agenda',
			agreementId: ev.source_id ?? ev.id,
			eventId: ev.id,
			studentName: ev.title,
			lessonTypeName: ev.title,
			lessonTypeColor: ev.color ?? null,
			lessonTypeIcon: null,
			isDeviation: false,
			isCancelled: false,
			isGroupLesson: false,
			sourceType: ev.source_type,
			color: ev.color ?? null,
			isLesson: isLessonEvent,
		},
	});
}
