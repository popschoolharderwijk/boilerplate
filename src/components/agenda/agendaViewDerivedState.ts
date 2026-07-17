import type { DeviationInfo } from '@/components/agenda/AgendaEventFormDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import type { useAgendaUI } from '@/hooks/useAgendaUI';
import { formatTimeFromDate } from '@/lib/time/time-format';
import type { AgendaEventDeviationRow } from '@/types/agenda-events';
import type { AgendaLessonAgreement } from '@/types/lesson-agreements';

type DeviationsByEventId = Map<string, Map<string, AgendaEventDeviationRow>>;

type AgendaUI = ReturnType<typeof useAgendaUI>;

interface DerivedStateInput {
	ui: AgendaUI;
	deviationsByEventId: DeviationsByEventId;
	agreementsMap: Map<string, AgendaLessonAgreement>;
	effectiveUserId: string | undefined;
	isPrivileged: boolean;
}

export interface AgendaViewDerivedState {
	occurrenceParticipantIds: string[] | null;
	occurrenceOverrides: { title: string | null; description: string | null; color: string | null } | null;
	occurrenceTimes: { start: string | null; end: string | null };
	editingAgreement: AgendaLessonAgreement | undefined;
	readonlyParticipantIds: string[];
	canAddParticipants: boolean;
	deviationInfo: DeviationInfo | null;
	lessonType: { name: string; icon: string | undefined; color: string | undefined } | null;
}

function getSelectedOccurrenceDeviation(ui: AgendaUI, deviationsByEventId: DerivedStateInput['deviationsByEventId']) {
	if (!ui.selectedEvent?.resource.eventId || !ui.selectedEvent.resource.originalDate || !ui.editingEvent?.id) {
		return null;
	}
	return (
		deviationsByEventId.get(ui.selectedEvent.resource.eventId)?.get(ui.selectedEvent.resource.originalDate) ?? null
	);
}

function getEditingAgreement(
	ui: AgendaUI,
	agreementsMap: DerivedStateInput['agreementsMap'],
): AgendaLessonAgreement | undefined {
	if (ui.editingEvent?.source_type !== 'lesson_agreement' || !ui.editingEvent.source_id) return undefined;
	return agreementsMap.get(ui.editingEvent.source_id) as AgendaLessonAgreement | undefined;
}

function buildReadonlyParticipantIds(editingAgreement: AgendaLessonAgreement | undefined): string[] {
	if (!editingAgreement) return [];
	if (editingAgreement.teacherUserId) {
		return [editingAgreement.student_user_id, editingAgreement.teacherUserId];
	}
	return [editingAgreement.student_user_id];
}

function buildCanAddParticipants(
	isPrivileged: boolean,
	ui: AgendaUI,
	editingAgreement: AgendaLessonAgreement | undefined,
	effectiveUserId: string | undefined,
): boolean {
	if (!isPrivileged) return false;
	if (ui.editingEvent?.source_type !== 'lesson_agreement' || !ui.editingEvent.source_id || !editingAgreement) {
		return true;
	}
	return effectiveUserId === editingAgreement.teacherUserId;
}

function buildDeviationInfo(ui: AgendaUI): DeviationInfo | null {
	const resource = ui.selectedEvent?.resource;
	if (!resource) return null;
	if (!(resource.isDeviation || resource.isCancelled)) return null;
	if (!resource.deviationId || !resource.originalDate || !resource.originalStartTime) return null;
	return {
		deviationId: resource.deviationId,
		originalDate: resource.originalDate,
		originalStartTime: resource.originalStartTime,
		isCancelled: resource.isCancelled,
		hasTimeOrDateChange: resource.hasTimeOrDateChange ?? false,
	};
}

function buildLessonType(selectedEvent: CalendarEvent | null) {
	if (!selectedEvent?.resource.lessonTypeName) return null;
	return {
		name: selectedEvent.resource.lessonTypeName,
		icon: selectedEvent.resource.lessonTypeIcon ?? undefined,
		color: selectedEvent.resource.lessonTypeColor ?? undefined,
	};
}

export function buildAgendaViewDerivedState(input: DerivedStateInput): AgendaViewDerivedState {
	const { ui, deviationsByEventId, agreementsMap, effectiveUserId, isPrivileged } = input;
	const selectedOccurrenceDeviation = getSelectedOccurrenceDeviation(ui, deviationsByEventId);
	const editingAgreement = getEditingAgreement(ui, agreementsMap);

	const occurrenceParticipantIds =
		selectedOccurrenceDeviation?.participant_ids && selectedOccurrenceDeviation.participant_ids.length > 0
			? selectedOccurrenceDeviation.participant_ids
			: null;

	const occurrenceOverrides = selectedOccurrenceDeviation
		? {
				title: selectedOccurrenceDeviation.title ?? null,
				description: selectedOccurrenceDeviation.description ?? null,
				color: selectedOccurrenceDeviation.color ?? null,
			}
		: null;

	const occurrenceTimes = !ui.selectedEvent?.resource.isDeviation
		? { start: null, end: null }
		: {
				start: ui.selectedEvent.start ? formatTimeFromDate(ui.selectedEvent.start) : null,
				end: ui.selectedEvent.end ? formatTimeFromDate(ui.selectedEvent.end) : null,
			};

	return {
		occurrenceParticipantIds,
		occurrenceOverrides,
		occurrenceTimes,
		editingAgreement,
		readonlyParticipantIds: buildReadonlyParticipantIds(editingAgreement),
		canAddParticipants: buildCanAddParticipants(isPrivileged, ui, editingAgreement, effectiveUserId),
		deviationInfo: buildDeviationInfo(ui),
		lessonType: buildLessonType(ui.selectedEvent),
	};
}
