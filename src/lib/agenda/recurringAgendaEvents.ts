import type { CalendarEvent } from '@/components/agenda/types';
import { isNonBillingMonthString } from '@/lib/billing/schoolYear';
import { addMinutes, formatDateToDb } from '@/lib/date/date-format';
import {
	addInterval as addIntervalHelper,
	addNIntervals,
	getFirstOccurrenceInRange as getFirstOccurrenceInRangeHelper,
	getOccurrenceIndex,
} from '@/lib/lessonHelpers';
import { applyTimeToDate, hasTimeChange } from '@/lib/time/time-format';
import type { AgendaEventDeviationRow, AgendaEventRow, CancellationType } from '@/types/agenda-events';
import type { LessonAgreementWithStudent, LessonFrequency } from '@/types/lesson-agreements';
import { findNoLessonPeriod, type NoLessonPeriod } from './eventGenerators';

type RecurringContext = {
	ev: AgendaEventRow;
	rangeStart: Date;
	rangeEnd: Date;
	eventDeviations: Map<string, AgendaEventDeviationRow> | undefined;
	recurringList: AgendaEventDeviationRow[];
	agreement: LessonAgreementWithStudent | null;
	isLessonEvent: boolean;
	isLessonSource: boolean;
	noLessonPeriods: NoLessonPeriod[] | undefined;
};

function resolveRecurringFrequency(ev: AgendaEventRow, agreement: LessonAgreementWithStudent | null): LessonFrequency {
	if (agreement) return agreement.frequency;
	if (
		ev.recurring_frequency === 'daily' ||
		ev.recurring_frequency === 'weekly' ||
		ev.recurring_frequency === 'biweekly' ||
		ev.recurring_frequency === 'monthly'
	) {
		return ev.recurring_frequency;
	}
	return 'weekly';
}

function getEventDurationMs(ev: AgendaEventRow, durationMinutes: number | null): number {
	if (durationMinutes != null) return durationMinutes * 60 * 1000;
	if (ev.end_time && ev.start_time) {
		const startDate = new Date(`2000-01-01T${ev.start_time}`);
		const endDate = new Date(`2000-01-01T${ev.end_time}`);
		return endDate.getTime() - startDate.getTime();
	}
	return 60 * 60 * 1000;
}

function resolveShiftedLessonDate(
	current: Date,
	shiftDays: number,
	noLessonPeriods: NoLessonPeriod[] | undefined,
): { shiftedDate: Date; shiftDays: number; isShifted: boolean } {
	const shiftedDate = new Date(current);
	let days = shiftDays;
	let isShifted = false;
	if (days > 0) shiftedDate.setDate(shiftedDate.getDate() + days);
	while (true) {
		const period = findNoLessonPeriod(shiftedDate, noLessonPeriods);
		if (!period) break;
		const len =
			Math.round(
				(Date.parse(`${period.end_date}T12:00:00`) - Date.parse(`${period.start_date}T12:00:00`)) / 86_400_000,
			) + 1;
		days += len;
		shiftedDate.setDate(shiftedDate.getDate() + len);
		isShifted = true;
	}
	return { shiftedDate, shiftDays: days, isShifted };
}

function buildDeviationEventTimes(
	ctx: RecurringContext,
	current: Date,
	effective: AgendaEventDeviationRow,
	durationMinutes: number | null,
	getDurationMs: () => number,
): { start: Date; end: Date; isCancelled: boolean } {
	if (effective.is_cancelled) {
		const start = applyTimeToDate(new Date(current), effective.original_start_time);
		const end =
			durationMinutes != null
				? addMinutes(start, durationMinutes)
				: ctx.ev.end_time
					? applyTimeToDate(start, ctx.ev.end_time)
					: addMinutes(start, 60);
		return { start, end, isCancelled: true };
	}

	const [h, m] = effective.actual_start_time.split(':').map(Number);
	let actualDate: Date;
	if (effective.spans_future_occurrences) {
		const frequency = resolveRecurringFrequency(ctx.ev, ctx.agreement);
		const originalDate = new Date(`${effective.original_date}T12:00:00`);
		const occurrenceIndex = getOccurrenceIndex(originalDate, current, frequency);
		actualDate = addNIntervals(new Date(`${effective.actual_date}T12:00:00`), occurrenceIndex, frequency);
	} else {
		actualDate = new Date(`${effective.actual_date}T12:00:00`);
	}
	actualDate.setHours(h, m ?? 0, 0, 0);
	return { start: actualDate, end: addMinutes(actualDate, getDurationMs() / (60 * 1000)), isCancelled: false };
}

function buildDefaultEventTimes(
	ctx: RecurringContext,
	base: Date,
	baseStartTime: string,
	durationMinutes: number | null,
	getDurationMs: () => number,
): { start: Date; end: Date } {
	const start = applyTimeToDate(new Date(base), baseStartTime);
	const end =
		durationMinutes != null
			? addMinutes(start, durationMinutes)
			: ctx.ev.end_time
				? applyTimeToDate(new Date(base), ctx.ev.end_time)
				: addMinutes(start, getDurationMs() / (60 * 1000));
	return { start, end };
}

function buildCalendarEventResource(
	ctx: RecurringContext,
	params: {
		dateStr: string;
		effective: AgendaEventDeviationRow | undefined;
		isShifted: boolean;
		isCancelled: boolean;
		displayTitle: string;
		displayColor: string | null;
		hasTimeOrDateChange: boolean;
		resourceOriginalDate: string | undefined;
		resourceOriginalStartTime: string | undefined;
		baseStartTime: string;
	},
): CalendarEvent['resource'] {
	const { ev, isLessonEvent } = ctx;
	const { effective } = params;
	return {
		type: 'agenda',
		agreementId: ev.source_id ?? ev.id,
		eventId: ev.id,
		deviationId: effective?.id,
		studentName: params.displayTitle,
		lessonTypeName: params.displayTitle,
		lessonTypeColor: params.displayColor,
		lessonTypeIcon: null,
		isDeviation: !!effective && !effective.is_cancelled,
		hasTimeOrDateChange: params.hasTimeOrDateChange || params.isShifted,
		isCancelled: params.isCancelled,
		isGroupLesson: false,
		originalDate: params.resourceOriginalDate ?? effective?.original_date,
		originalStartTime: params.resourceOriginalStartTime ?? effective?.original_start_time,
		reason: effective?.reason ?? (params.isShifted ? 'Verschoven door lesvrije periode' : null),
		isRecurring: ev.recurring || (effective?.spans_future_occurrences ?? false),
		sourceType: ev.source_type,
		color: params.displayColor,
		isLesson: isLessonEvent,
		cancellationType: effective
			? ((effective as AgendaEventDeviationRow & { cancellation_type?: CancellationType }).cancellation_type ??
				undefined)
			: undefined,
		needsReschedule: effective
			? ((effective as AgendaEventDeviationRow & { needs_reschedule?: boolean }).needs_reschedule ?? false)
			: false,
	};
}

export function appendRecurringAgendaEvents(
	ev: AgendaEventRow,
	events: CalendarEvent[],
	rangeStart: Date,
	rangeEnd: Date,
	eventDeviations: Map<string, AgendaEventDeviationRow> | undefined,
	recurringList: AgendaEventDeviationRow[],
	agreement: LessonAgreementWithStudent | null,
	isLessonEvent: boolean,
	isLessonSource: boolean,
	noLessonPeriods: NoLessonPeriod[] | undefined,
): void {
	const ctx: RecurringContext = {
		ev,
		rangeStart,
		rangeEnd,
		eventDeviations,
		recurringList,
		agreement,
		isLessonEvent,
		isLessonSource,
		noLessonPeriods,
	};
	const frequency = resolveRecurringFrequency(ev, agreement);
	const dayOfWeek = agreement ? agreement.day_of_week : new Date(`${ev.start_date}T12:00:00`).getDay();
	const periodStart = agreement ? new Date(agreement.start_date) : new Date(ev.start_date);
	const periodEnd = agreement
		? agreement.end_date
			? new Date(agreement.end_date)
			: null
		: ev.recurring_end_date
			? new Date(ev.recurring_end_date)
			: null;
	const baseStartTime = agreement ? agreement.start_time : ev.start_time;
	const durationMinutes = agreement ? agreement.duration_minutes : null;
	const getDurationMs = () => getEventDurationMs(ev, durationMinutes);

	const current = getFirstOccurrenceInRangeHelper(dayOfWeek, periodStart, periodStart, frequency);
	let shiftDays = 0;

	while (true) {
		if (periodEnd && current > periodEnd) break;
		if (current > rangeEnd && shiftDays === 0) break;
		if (current > rangeEnd) break;

		const dateStr = formatDateToDb(current);
		const deviation = eventDeviations?.get(dateStr);
		const recurringDeviation = recurringList.find(
			(d) => d.original_date <= dateStr && (!d.spans_end_date || d.spans_end_date >= dateStr),
		);
		const effective = deviation ?? recurringDeviation;

		let shiftedDate: Date | null = null;
		let isShifted = false;
		let outsideRenderWindow = false;

		if (isLessonSource && !effective) {
			const shift = resolveShiftedLessonDate(current, shiftDays, noLessonPeriods);
			shiftDays = shift.shiftDays;
			shiftedDate = shift.shiftedDate;
			isShifted = shift.isShifted;
			if (periodEnd && shiftedDate > periodEnd) {
				addIntervalHelper(current, frequency);
				continue;
			}
			if (isNonBillingMonthString(formatDateToDb(shiftedDate))) {
				addIntervalHelper(current, frequency);
				continue;
			}
			if (shiftedDate < rangeStart || shiftedDate > rangeEnd) outsideRenderWindow = true;
		} else if (current < rangeStart) {
			outsideRenderWindow = true;
		}

		if (outsideRenderWindow) {
			addIntervalHelper(current, frequency);
			continue;
		}

		const times = effective
			? buildDeviationEventTimes(ctx, current, effective, durationMinutes, getDurationMs)
			: {
					...buildDefaultEventTimes(
						ctx,
						shiftedDate ?? new Date(current),
						baseStartTime,
						durationMinutes,
						getDurationMs,
					),
					isCancelled: false,
				};

		const resourceOriginalDate = effective?.spans_future_occurrences
			? dateStr
			: (effective?.original_date ?? (isShifted ? dateStr : undefined));
		const resourceOriginalStartTime = effective?.spans_future_occurrences
			? baseStartTime
			: (effective?.original_start_time ?? (isShifted ? baseStartTime : undefined));
		const displayTitle = effective?.title ?? ev.title;
		const displayColor = effective?.color ?? ev.color ?? null;
		const hasTimeOrDateChange =
			!!effective &&
			!effective.is_cancelled &&
			(effective.actual_date !== effective.original_date ||
				hasTimeChange(effective.actual_start_time, effective.original_start_time));

		events.push({
			title: displayTitle,
			start: times.start,
			end: times.end,
			resource: buildCalendarEventResource(ctx, {
				dateStr,
				effective,
				isShifted,
				isCancelled: times.isCancelled,
				displayTitle,
				displayColor,
				hasTimeOrDateChange,
				resourceOriginalDate,
				resourceOriginalStartTime,
				baseStartTime,
			}),
		});

		addIntervalHelper(current, frequency);
	}
}
