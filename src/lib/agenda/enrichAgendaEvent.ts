import type { CalendarEvent } from '@/components/agenda/types';
import {
	buildLessonAgreementStudentInfo,
	buildLessonAgreementTeacherName,
} from '@/lib/agenda/enrichLessonAgreementHelpers';
import { getDisplayName } from '@/lib/display-name';
import type { User } from '@/types/users';
import type { EnrichAgendaEventContext } from './enrichAgendaEventContext';

function withParticipants(ev: CalendarEvent, ctx: EnrichAgendaEventContext): CalendarEvent {
	const deviationId = ev.resource.deviationId;
	const hasDeviationParticipants =
		deviationId &&
		(ctx.participantCountByDeviationId.has(deviationId) || ctx.participantNamesByDeviationId.has(deviationId));

	const participantCount =
		hasDeviationParticipants && deviationId
			? ctx.participantCountByDeviationId.get(deviationId)
			: ev.resource.eventId
				? ctx.participantCountByEventId.get(ev.resource.eventId)
				: undefined;
	const participantNames =
		hasDeviationParticipants && deviationId
			? ctx.participantNamesByDeviationId.get(deviationId)
			: ev.resource.eventId
				? ctx.participantNamesByEventId.get(ev.resource.eventId)
				: undefined;

	return {
		...ev,
		resource: { ...ev.resource, participantCount, participantNames },
	};
}

function enrichProjectAgendaEvent(ev: CalendarEvent, ctx: EnrichAgendaEventContext): CalendarEvent | null {
	if (ev.resource.sourceType !== 'project' || !ev.resource.agreementId) return null;
	const project = ctx.projectsMap.get(ev.resource.agreementId);
	if (!project) return null;
	const appointmentTitle = (typeof ev.title === 'string' ? ev.title : '').trim();
	const displayTitle = appointmentTitle ? `${project.name} - ${appointmentTitle}` : project.name;
	return {
		...ev,
		title: displayTitle,
		resource: {
			...ev.resource,
			projectId: project.id,
			projectName: project.name,
			lessonTypeName: project.name,
			studentName: project.name,
		},
	};
}

function enrichLessonGroupAgendaEvent(ev: CalendarEvent, ctx: EnrichAgendaEventContext): CalendarEvent | null {
	if (ev.resource.sourceType !== 'lesson_group' || !ev.resource.agreementId) return null;
	const group = ctx.lessonGroupsMap.get(ev.resource.agreementId);
	if (!group) return null;
	const users = group.memberUserIds.map((uid) => ctx.profileMap.get(uid)).filter((p): p is User => !!p);
	const participantCount = ev.resource.participantCount;
	const count = users.length || (participantCount ?? 0);
	const title = count > 0 ? `${group.name} (${count})` : group.name;
	const deviation =
		ev.resource.eventId && ev.resource.originalDate
			? ctx.deviationsByEventId.get(ev.resource.eventId)?.get(ev.resource.originalDate)
			: undefined;

	return {
		...ev,
		title,
		resource: {
			...ev.resource,
			lessonGroupId: group.id,
			lessonGroupName: group.name,
			lessonTypeName: group.lessonTypeName ?? group.name,
			lessonTypeColor: ev.resource.color ?? group.lessonTypeColor,
			lessonTypeIcon: group.lessonTypeIcon,
			studentName: users.map((u) => getDisplayName(u)).join(', ') || group.name,
			isGroupLesson: true,
			studentCount: count,
			users,
			isLesson: true,
			cancelledParticipantIds: deviation?.cancelled_participant_ids ?? undefined,
		},
	};
}

function enrichLessonAgreementAgendaEvent(ev: CalendarEvent, ctx: EnrichAgendaEventContext): CalendarEvent | null {
	if (ev.resource.sourceType !== 'lesson_agreement' || !ev.resource.agreementId) return null;
	const agreement = ctx.agreementsMap.get(ev.resource.agreementId);
	if (!agreement) return null;

	const teacherUid = agreement.teacherUserId;
	const studentInfo = buildLessonAgreementStudentInfo(agreement, ev.resource.eventId, teacherUid, ctx);
	const teacherName = buildLessonAgreementTeacherName(agreement.teacherProfile);

	return {
		...ev,
		title: `${studentInfo.studentName} - ${agreement.lesson_types.name}`,
		resource: {
			...ev.resource,
			studentName: studentInfo.studentName,
			teacherName,
			viewerIsTeacher: ctx.viewerUserId === agreement.teacherUserId,
			lessonTypeName: agreement.lesson_types.name,
			lessonTypeColor: agreement.lesson_types.color,
			lessonTypeIcon: agreement.lesson_types.icon,
			isGroupLesson: agreement.lesson_types.is_group_lesson ?? false,
			isDuoLesson: studentInfo.isDuo,
			studentCount: studentInfo.isDuo
				? studentInfo.studentUsers.length
				: agreement.lesson_types.is_group_lesson
					? 1
					: undefined,
			user: studentInfo.user ?? undefined,
			users: studentInfo.isDuo ? studentInfo.studentUsers : studentInfo.user ? [studentInfo.user] : undefined,
			isLesson: true,
		},
	};
}

export function enrichAgendaEvent(ev: CalendarEvent, ctx: EnrichAgendaEventContext): CalendarEvent {
	const enriched = withParticipants(ev, ctx);
	return (
		enrichProjectAgendaEvent(enriched, ctx) ??
		enrichLessonGroupAgendaEvent(enriched, ctx) ??
		enrichLessonAgreementAgendaEvent(enriched, ctx) ??
		enriched
	);
}

export type { EnrichAgendaEventContext, LessonGroupInfo } from './enrichAgendaEventContext';
