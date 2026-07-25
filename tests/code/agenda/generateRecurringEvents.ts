import type { CalendarEvent } from '../../../src/components/agenda/types';
import { buildParticipantInfo } from '../../../src/lib/agenda/eventUtils';
import { pushToMapArray } from '../../../src/lib/collections';
import { addMinutes, formatDateToDb, getDateForDayOfWeek } from '../../../src/lib/date/date-format';
import { getDisplayName } from '../../../src/lib/display-name';
import {
	addInterval as addIntervalHelper,
	getFirstOccurrenceInRange as getFirstOccurrenceInRangeHelper,
} from '../../../src/lib/lessonHelpers';
import { applyTimeToDate, hasTimeChange } from '../../../src/lib/time/time-format';
import type { AgendaEventDeviationRow, CancellationType } from '../../../src/types/agenda-events';
import type { LessonAgreementWithStudent, LessonFrequency } from '../../../src/types/lesson-agreements';
import type { User, UserOptional } from '../../../src/types/users';
import type { LessonAppointmentDeviationWithAgreement } from './types';

function getFrequency(agreement: LessonAgreementWithStudent): LessonFrequency {
	return agreement.frequency;
}

function getFirstOccurrenceInRange(
	agreement: LessonAgreementWithStudent,
	rangeStart: Date,
	frequency: LessonFrequency,
): Date {
	const periodStart = new Date(agreement.start_date);
	return getFirstOccurrenceInRangeHelper(agreement.day_of_week, rangeStart, periodStart, frequency);
}

function addInterval(date: Date, frequency: LessonFrequency): void {
	addIntervalHelper(date, frequency);
}

function getGroupingKey(agreement: LessonAgreementWithStudent, frequency: LessonFrequency): string {
	const base = `${agreement.start_time}-${agreement.lesson_type_id}-${frequency}`;
	if (frequency === 'weekly') return `${agreement.day_of_week}-${base}`;
	if (frequency === 'daily') return base;
	return `${agreement.start_date}-${base}`;
}

function getRecurringDeviationForDate(
	recurringByEventId: Map<string, LessonAppointmentDeviationWithAgreement[]>,
	eventId: string,
	occurrenceDateStr: string,
): LessonAppointmentDeviationWithAgreement | undefined {
	const list = recurringByEventId.get(eventId);
	if (!list?.length) return undefined;
	return list.find(
		(d) => d.original_date <= occurrenceDateStr && (!d.spans_end_date || d.spans_end_date >= occurrenceDateStr),
	);
}

export function generateRecurringEvents(
	agreements: LessonAgreementWithStudent[],
	rangeStart: Date,
	rangeEnd: Date,
	deviations: Map<string, LessonAppointmentDeviationWithAgreement>,
	recurringByEventId?: Map<string, LessonAppointmentDeviationWithAgreement[]>,
	eventIdByAgreementId?: Map<string, string>,
): CalendarEvent[] {
	const events: CalendarEvent[] = [];
	const getEventId = (agreementId: string) => eventIdByAgreementId?.get(agreementId);

	const groupedAgreements = new Map<string, LessonAgreementWithStudent[]>();
	for (const agreement of agreements) {
		const frequency = getFrequency(agreement);
		const key = getGroupingKey(agreement, frequency);
		pushToMapArray(groupedAgreements, key, agreement);
	}

	for (const [, group] of groupedAgreements) {
		const firstAgreement = group[0];
		const frequency = getFrequency(firstAgreement);
		const isGroupLesson = firstAgreement.lesson_types.is_group_lesson;
		const durationMinutes = firstAgreement.duration_minutes;
		const eventId = getEventId(firstAgreement.id);

		const studentNames = group.map((a) => getDisplayName(a.profiles));

		const earliestStartDate = new Date(Math.min(...group.map((a) => new Date(a.start_date).getTime())));
		const latestEndDate = group.some((a) => !a.end_date)
			? null
			: new Date(
					Math.max(...group.filter((a) => a.end_date).map((a) => new Date(a.end_date as string).getTime())),
				);

		const currentLessonDate = getFirstOccurrenceInRange(firstAgreement, rangeStart, frequency);

		while (currentLessonDate <= rangeEnd) {
			if (currentLessonDate >= earliestStartDate && (!latestEndDate || currentLessonDate <= latestEndDate)) {
				const lessonDateStr = formatDateToDb(currentLessonDate);

				if (!isGroupLesson && group.length === 1 && eventId) {
					const deviation = deviations.get(`${eventId}-${lessonDateStr}`);

					if (deviation) {
						const isCancelled = deviation.is_cancelled;
						const timeStr = isCancelled ? deviation.original_start_time : deviation.actual_start_time;
						const baseDate = isCancelled ? deviation.original_date : deviation.actual_date;
						const eventDate = applyTimeToDate(new Date(baseDate), timeStr);

						const actualDayOfWeek = new Date(deviation.actual_date).getDay();
						const actualTimeNormalized = deviation.actual_start_time.substring(0, 5);
						const agreementTimeNormalized = firstAgreement.start_time.substring(0, 5);
						const isEffectivelyOriginal =
							!isCancelled &&
							actualDayOfWeek === firstAgreement.day_of_week &&
							actualTimeNormalized === agreementTimeNormalized;

						const lesson = deviation.lesson_agreement ?? firstAgreement;
						const deviationUserOptional = lesson.profiles as UserOptional | null;
						const deviationStudentName = getDisplayName(deviationUserOptional);
						const deviationUserInfo = buildParticipantInfo(
							deviationUserOptional,
							'student_user_id' in lesson ? lesson.student_user_id : firstAgreement.student_user_id,
						);
						const lessonTypeName =
							'lesson_types' in lesson
								? lesson.lesson_types.name
								: (deviation.agenda_event?.title ?? firstAgreement.lesson_types.name);
						const lessonTypeColor = 'lesson_types' in lesson ? lesson.lesson_types.color : null;
						const lessonTypeIcon = 'lesson_types' in lesson ? lesson.lesson_types.icon : null;
						const hasTimeOrDateChange =
							!isCancelled &&
							(deviation.actual_date !== deviation.original_date ||
								hasTimeChange(deviation.actual_start_time, deviation.original_start_time));

						events.push({
							title: `${lessonTypeName} - ${deviationStudentName}`,
							start: eventDate,
							end: addMinutes(eventDate, durationMinutes),
							resource: {
								type: isEffectivelyOriginal ? 'agreement' : 'deviation',
								agreementId: firstAgreement.id,
								eventId,
								deviationId: deviation.id,
								studentName: deviationStudentName,
								user: deviationUserInfo,
								lessonTypeName,
								lessonTypeColor,
								lessonTypeIcon,
								isDeviation: !isCancelled && !isEffectivelyOriginal,
								hasTimeOrDateChange,
								isCancelled,
								isGroupLesson: false,
								originalDate: deviation.original_date,
								originalStartTime: deviation.original_start_time,
								reason: deviation.reason,
								isRecurring: !!deviation.spans_future_occurrences,
								cancellationType:
									(deviation as AgendaEventDeviationRow & { cancellation_type?: CancellationType })
										.cancellation_type ?? undefined,
								needsReschedule:
									(deviation as AgendaEventDeviationRow & { needs_reschedule?: boolean })
										.needs_reschedule ?? false,
							},
						});
						addInterval(currentLessonDate, frequency);
						continue;
					}

					const recurringDeviation = getRecurringDeviationForDate(
						recurringByEventId ?? new Map(),
						eventId,
						lessonDateStr,
					);
					if (recurringDeviation) {
						const isCancelled = recurringDeviation.is_cancelled;
						const actualDayOfWeek = new Date(recurringDeviation.actual_date).getDay();
						const eventDate = applyTimeToDate(
							getDateForDayOfWeek(actualDayOfWeek, currentLessonDate),
							recurringDeviation.actual_start_time,
						);

						const recLesson = recurringDeviation.lesson_agreement ?? firstAgreement;
						const recurringUserOptional = recLesson.profiles as UserOptional | null;
						const recurringStudentName = getDisplayName(recurringUserOptional);
						const recurringUserInfo = buildParticipantInfo(
							recurringUserOptional,
							'student_user_id' in recLesson ? recLesson.student_user_id : firstAgreement.student_user_id,
						);
						const recTypeName =
							'lesson_types' in recLesson
								? recLesson.lesson_types.name
								: (recurringDeviation.agenda_event?.title ?? firstAgreement.lesson_types.name);
						const recTypeColor = 'lesson_types' in recLesson ? recLesson.lesson_types.color : null;
						const recTypeIcon = 'lesson_types' in recLesson ? recLesson.lesson_types.icon : null;
						const recHasTimeOrDateChange =
							!isCancelled &&
							(recurringDeviation.actual_date !== recurringDeviation.original_date ||
								hasTimeChange(
									recurringDeviation.actual_start_time,
									recurringDeviation.original_start_time,
								));

						events.push({
							title: `${recTypeName} - ${recurringStudentName}`,
							start: eventDate,
							end: addMinutes(eventDate, durationMinutes),
							resource: {
								type: 'deviation',
								agreementId: firstAgreement.id,
								eventId,
								deviationId: recurringDeviation.id,
								studentName: recurringStudentName,
								user: recurringUserInfo,
								lessonTypeName: recTypeName,
								lessonTypeColor: recTypeColor,
								lessonTypeIcon: recTypeIcon,
								isDeviation: !isCancelled,
								hasTimeOrDateChange: recHasTimeOrDateChange,
								isCancelled,
								isGroupLesson: false,
								originalDate: recurringDeviation.original_date,
								originalStartTime: recurringDeviation.original_start_time,
								reason: recurringDeviation.reason,
								isRecurring: true,
								cancellationType:
									(
										recurringDeviation as AgendaEventDeviationRow & {
											cancellation_type?: CancellationType;
										}
									).cancellation_type ?? undefined,
								needsReschedule:
									(recurringDeviation as AgendaEventDeviationRow & { needs_reschedule?: boolean })
										.needs_reschedule ?? false,
							},
						});
						addInterval(currentLessonDate, frequency);
						continue;
					}
				}

				const eventDate = applyTimeToDate(new Date(currentLessonDate), firstAgreement.start_time);

				const title = isGroupLesson
					? `${firstAgreement.lesson_types.name} (${group.length} deelnemers)`
					: `${firstAgreement.lesson_types.name} - ${studentNames[0]}`;

				const users = group
					.map((a) => buildParticipantInfo(a.profiles as UserOptional | null, a.student_user_id))
					.filter((info): info is User => info !== undefined);

				events.push({
					title,
					start: eventDate,
					end: addMinutes(eventDate, durationMinutes),
					resource: {
						type: 'agreement',
						agreementId: firstAgreement.id,
						eventId: eventId ?? undefined,
						studentName: isGroupLesson ? studentNames.join(', ') : studentNames[0],
						user: !isGroupLesson && users.length > 0 ? users[0] : undefined,
						users: isGroupLesson ? users : undefined,
						lessonTypeName: firstAgreement.lesson_types.name,
						lessonTypeColor: firstAgreement.lesson_types.color,
						lessonTypeIcon: firstAgreement.lesson_types.icon,
						isDeviation: false,
						isCancelled: false,
						isGroupLesson,
						studentCount: isGroupLesson ? group.length : undefined,
					},
				});
			}

			addInterval(currentLessonDate, frequency);
		}
	}

	return events;
}
