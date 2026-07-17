import { toast } from 'sonner';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import { formatAgendaEventSaveError, saveAgendaEventForm } from '@/lib/agenda/agendaEventFormSave';
import type { AgendaEventRow, AgendaEventSourceType } from '@/types/agenda-events';
import type { LessonFrequency } from '@/types/lesson-agreements';

export function canPerformAgendaEventSave(
	userId: string | undefined,
	startDate: string | null,
	startTime: string,
): userId is string {
	return Boolean(userId && startDate && startTime);
}

export function getAgendaEventSaveFields(
	userId: string | undefined,
	startDate: string | null,
	startTime: string,
): { userId: string; startDate: string; startTime: string } | null {
	if (!canPerformAgendaEventSave(userId, startDate, startTime) || !startDate) return null;
	return { userId, startDate, startTime };
}

export interface RunPerformAgendaEventSaveParams {
	scope: RecurrenceScope;
	userId: string | undefined;
	formFields: {
		startDate: string | null;
		startTime: string;
		endDate: string | null;
		endTime: string;
		isAllDay: boolean;
		recurring: boolean;
		recurringFrequency: LessonFrequency;
		recurringEndDate: string | null;
		color: string | null;
		title: string;
		description: string;
	};
	participantIds: string[];
	initialParticipantIds: string[];
	event: AgendaEventRow | null | undefined;
	occurrenceDate: string | null | undefined;
	occurrenceStartTime: string | null | undefined;
	externalSourceType: AgendaEventSourceType | undefined;
	externalSourceId: string | null | undefined;
	setSaving: (saving: boolean) => void;
	onSuccess?: () => void;
	onOpenChange: (open: boolean) => void;
}

type AgendaEventSaveFields = { userId: string; startDate: string; startTime: string };

export function buildAgendaEventFormSaveInput(
	saveFields: AgendaEventSaveFields,
	params: RunPerformAgendaEventSaveParams,
) {
	return {
		userId: saveFields.userId,
		startDate: saveFields.startDate,
		startTime: saveFields.startTime,
		endDate: params.formFields.endDate,
		endTime: params.formFields.endTime,
		isAllDay: params.formFields.isAllDay,
		recurring: params.formFields.recurring,
		recurringFrequency: params.formFields.recurringFrequency,
		recurringEndDate: params.formFields.recurringEndDate,
		color: params.formFields.color ?? '',
		title: params.formFields.title,
		description: params.formFields.description,
		participantIds: params.participantIds,
		initialParticipantIds: params.initialParticipantIds,
		event: params.event,
		occurrenceDate: params.occurrenceDate,
		occurrenceStartTime: params.occurrenceStartTime,
		externalSourceType: params.externalSourceType,
		externalSourceId: params.externalSourceId,
		scope: params.scope,
	};
}

export async function runPerformAgendaEventSave(params: RunPerformAgendaEventSaveParams): Promise<void> {
	const saveFields = getAgendaEventSaveFields(
		params.userId,
		params.formFields.startDate,
		params.formFields.startTime,
	);
	if (!saveFields) return;

	params.setSaving(true);
	try {
		await saveAgendaEventForm(buildAgendaEventFormSaveInput(saveFields, params));
		params.onSuccess?.();
		params.onOpenChange(false);
	} catch (err: unknown) {
		toast.error(formatAgendaEventSaveError(err));
	} finally {
		params.setSaving(false);
	}
}
