import type { CalendarEventResource } from '@/components/agenda/types';
import { formatDbDateLong } from '@/lib/date/date-format';
import { formatTime } from '@/lib/time/time-format';

export function buildTooltipFirstLine(eventTitle: string, resource: CalendarEventResource): string {
	if (resource.sourceType === 'project') {
		return `📁 ${eventTitle}`;
	}
	return resource.lessonTypeName;
}

export function buildTooltipParticipantLines(resource: CalendarEventResource): string[] {
	const {
		isLesson,
		isGroupLesson,
		studentName,
		studentCount,
		participantCount,
		participantNames,
		teacherName,
		viewerIsTeacher,
	} = resource;

	if (isLesson && !isGroupLesson) {
		const otherPartyName = viewerIsTeacher ? studentName : (teacherName ?? studentName);
		return [otherPartyName];
	}

	if (isGroupLesson) {
		const lines = [`${studentCount} deelnemers:`];
		for (const student of studentName.split(', ')) {
			lines.push(`  • ${student}`);
		}
		return lines;
	}

	if ((participantCount ?? 0) > 1 && participantNames?.length) {
		const lines = [`${participantCount} deelnemers:`];
		for (const name of participantNames) {
			lines.push(`  • ${name}`);
		}
		return lines;
	}

	return [studentName];
}

export function buildTooltipStatusLines(resource: CalendarEventResource): string[] {
	const { isCancelled, hasTimeOrDateChange, sourceType, reason, originalDate, originalStartTime } = resource;

	if (isCancelled) {
		const lines = [''];
		const cancelledLabel = sourceType === 'lesson_agreement' ? '❌ Les vervallen' : '❌ Afspraak vervallen';
		lines.push(cancelledLabel);
		if (reason) {
			lines.push(`Reden: ${reason}`);
		}
		return lines;
	}

	if (!hasTimeOrDateChange) {
		return [];
	}

	const lines = ['', '⚠ Gewijzigde afspraak'];
	if (originalDate && originalStartTime) {
		lines.push(`Origineel: ${formatDbDateLong(originalDate)} om ${formatTime(originalStartTime)}`);
	}
	if (reason) {
		lines.push(`Reden: ${reason}`);
	}
	return lines;
}
