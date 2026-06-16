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

function toLessonFrequency(freq: string | null): LessonFrequency {
	if (freq === 'daily' || freq === 'weekly' || freq === 'biweekly' || freq === 'monthly') return freq;
	return 'weekly';
}

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

function noLessonPeriodLengthDays(p: NoLessonPeriod): number {
	const start = Date.parse(`${p.start_date}T12:00:00`);
	const end = Date.parse(`${p.end_date}T12:00:00`);
	return Math.round((end - start) / 86_400_000) + 1;
}

function addDays(date: Date, days: number): void {
	date.setDate(date.getDate() + days);
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
		const sourceType = ev.source_type;
		const eventDeviations = deviationsByEventId.get(ev.id);
		const recurringList = recurringByEventId?.get(ev.id) ?? [];

		const isLessonEvent = ev.source_type === 'lesson_agreement' && !!ev.source_id;
		const agreement = isLessonEvent && agreementsMap ? agreementsMap.get(ev.source_id as string) : null;

		if (!ev.recurring || !ev.recurring_frequency) {
			const start = new Date(`${ev.start_date}T${ev.start_time}`);
			const end = ev.end_time
				? new Date(`${ev.end_date ?? ev.start_date}T${ev.end_time}`)
				: addMinutes(start, 60);
			if (start >= rangeStart && start <= rangeEnd) {
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
						sourceType,
						color: ev.color ?? null,
						isLesson: isLessonEvent,
					},
				});
			}
			continue;
		}

		const frequency = agreement ? agreement.frequency : toLessonFrequency(ev.recurring_frequency);
		const dayOfWeek = agreement ? agreement.day_of_week : new Date(ev.start_date + 'T12:00:00').getDay();
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

		const getDurationMs = (): number => {
			if (durationMinutes != null) return durationMinutes * 60 * 1000;
			if (ev.end_time && ev.start_time) {
				const startDate = new Date(`2000-01-01T${ev.start_time}`);
				const endDate = new Date(`2000-01-01T${ev.end_time}`);
				return endDate.getTime() - startDate.getTime();
			}
			return 60 * 60 * 1000;
		};

		// Start iteration from periodStart so we can accumulate the "shift" caused by
		// no_lesson_periods that occur before the rendered range. Each no_lesson_period a
		// lesson lands in adds its length (in days) to a cumulative shift applied to all
		// subsequent non-deviated lessons.
		const current = getFirstOccurrenceInRangeHelper(dayOfWeek, periodStart, periodStart, frequency);
		let shiftDays = 0;
		const isLessonSource = sourceType === 'lesson_agreement' || sourceType === 'lesson_group';

		while (true) {
			if (periodEnd && current > periodEnd) break;
			// Safety: once we are past the render window and shift can no longer grow
			// (we keep iterating but bail), stop to avoid unbounded work.
			if (current > rangeEnd && shiftDays === 0) break;
			if (current > rangeEnd) {
				// shifted dates are >= current, so they will also be outside the range.
				break;
			}

			const dateStr = formatDateToDb(current);
			const deviation = eventDeviations?.get(dateStr);
			const recurringDeviation = recurringList.find(
				(d) => d.original_date <= dateStr && (!d.spans_end_date || d.spans_end_date >= dateStr),
			);

			const effective = deviation ?? recurringDeviation;

			// Determine the effective lesson date with cumulative shift applied.
			// Deviations (admin-set) ignore the shift entirely.
			let shiftedDate: Date | null = null;
			let isShifted = false;
			let outsideRenderWindow = false;

			if (isLessonSource && !effective) {
				shiftedDate = new Date(current);
				if (shiftDays > 0) addDays(shiftedDate, shiftDays);
				// While the shifted date lands in a no_lesson_period, grow the shift.
				while (true) {
					const period = findNoLessonPeriod(shiftedDate, noLessonPeriods);
					if (!period) break;
					const len = noLessonPeriodLengthDays(period);
					shiftDays += len;
					addDays(shiftedDate, len);
					isShifted = true;
				}
				// Hard end-date: shifted past the agreement end → lesson is dropped.
				if (periodEnd && shiftedDate > periodEnd) {
					addIntervalHelper(current, frequency);
					continue;
				}
				// August is skipped (summer break, no shift mutation).
				if (isNonBillingMonthString(formatDateToDb(shiftedDate))) {
					addIntervalHelper(current, frequency);
					continue;
				}
				// Outside render window: skip rendering but keep iterating to accumulate shift.
				if (shiftedDate < rangeStart || shiftedDate > rangeEnd) {
					outsideRenderWindow = true;
				}
			} else {
				// Non-lesson sources OR deviation present: use original `current` for the
				// in-range check; deviation branch will compute its own actual date below.
				if (current < rangeStart) {
					outsideRenderWindow = true;
				}
			}

			if (outsideRenderWindow) {
				addIntervalHelper(current, frequency);
				continue;
			}

			let start: Date;
			let end: Date;
			let isCancelled = false;

			if (effective?.is_cancelled) {
				isCancelled = true;
				start = applyTimeToDate(new Date(current), effective.original_start_time);
				end =
					durationMinutes != null
						? addMinutes(start, durationMinutes)
						: ev.end_time
							? applyTimeToDate(start, ev.end_time)
							: addMinutes(start, 60);
			} else if (effective) {
				const [h, m] = effective.actual_start_time.split(':').map(Number);
				let actualDate: Date;
				if (effective.spans_future_occurrences) {
					const originalDate = new Date(effective.original_date + 'T12:00:00');
					const occurrenceIndex = getOccurrenceIndex(originalDate, current, frequency);
					actualDate = addNIntervals(
						new Date(effective.actual_date + 'T12:00:00'),
						occurrenceIndex,
						frequency,
					);
				} else {
					actualDate = new Date(effective.actual_date + 'T12:00:00');
				}
				actualDate.setHours(h, m ?? 0, 0, 0);
				start = actualDate;
				end = addMinutes(start, getDurationMs() / (60 * 1000));
			} else {
				const base = shiftedDate ?? new Date(current);
				start = applyTimeToDate(new Date(base), baseStartTime);
				end =
					durationMinutes != null
						? addMinutes(start, durationMinutes)
						: ev.end_time
							? applyTimeToDate(new Date(base), ev.end_time)
							: addMinutes(start, 60);
			}

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
				start,
				end,
				resource: {
					type: 'agenda',
					agreementId: ev.source_id ?? ev.id,
					eventId: ev.id,
					deviationId: effective?.id,
					studentName: displayTitle,
					lessonTypeName: displayTitle,
					lessonTypeColor: displayColor,
					lessonTypeIcon: null,
					isDeviation: !!effective && !effective.is_cancelled,
					hasTimeOrDateChange: hasTimeOrDateChange || isShifted,
					isCancelled,
					isGroupLesson: false,
					originalDate: resourceOriginalDate ?? effective?.original_date,
					originalStartTime: resourceOriginalStartTime ?? effective?.original_start_time,
					reason: effective?.reason ?? (isShifted ? 'Verschoven door lesvrije periode' : null),
					isRecurring: ev.recurring || (effective?.spans_future_occurrences ?? false),
					sourceType,
					color: displayColor,
					isLesson: isLessonEvent,
					cancellationType: effective
						? ((effective as AgendaEventDeviationRow & { cancellation_type?: CancellationType })
								.cancellation_type ?? undefined)
						: undefined,
					needsReschedule: effective
						? ((effective as AgendaEventDeviationRow & { needs_reschedule?: boolean }).needs_reschedule ??
							false)
						: false,
				},
			});

			addIntervalHelper(current, frequency);
		}
	}

	return events;
}
