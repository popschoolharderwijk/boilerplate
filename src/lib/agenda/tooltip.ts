import type { CalendarEvent } from '@/components/agenda/types';
import {
	buildTooltipFirstLine,
	buildTooltipParticipantLines,
	buildTooltipStatusLines,
} from '@/lib/agenda/tooltipHelpers';

export function buildTooltipText(event: CalendarEvent): string {
	const lines = [
		buildTooltipFirstLine(String(event.title), event.resource),
		...buildTooltipParticipantLines(event.resource),
		...buildTooltipStatusLines(event.resource),
	];
	return lines.join('\n');
}
