import type { AgendaEventRow } from '@/types/agenda-events';
import type { AgendaAgreementLike } from './moveAgendaEvent';

export type AgendaOpResult = { ok: true; message: string } | { ok: false; message: string };

export function lookupAgendaEvent(
	eventId: string | undefined | null,
	agendaEvents: AgendaEventRow[],
): { event: AgendaEventRow } | AgendaOpResult {
	if (!eventId) return { ok: false, message: 'Geen afspraak' };
	const event = agendaEvents.find((e) => e.id === eventId);
	if (!event) return { ok: false, message: 'Afspraak niet gevonden' };
	return { event };
}

export function getAgendaLessonContext(agendaEvent: AgendaEventRow, agreementsMap: Map<string, AgendaAgreementLike>) {
	const isLessonEvent = agendaEvent.source_type === 'lesson_agreement' && agendaEvent.source_id;
	const agreement = isLessonEvent ? agreementsMap.get(agendaEvent.source_id as string) : null;
	const baseStartTime = agreement ? agreement.start_time : agendaEvent.start_time;
	return { agreement, baseStartTime };
}
