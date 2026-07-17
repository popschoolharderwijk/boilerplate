import {
	AgendaEventCancelLessonAction,
	AgendaEventDeleteAction,
	AgendaEventMarkTrialCompletedAction,
	AgendaEventRestoreLessonAction,
} from '@/components/agenda/AgendaEventFormLeftActionButtons';
import type { AgendaEventFormPermissions } from '@/components/agenda/agenda-event-form-types';
import type { AgendaEventFormFooterState } from '@/lib/agenda/agendaEventFormFooterHelpers';
import { resolveAgendaEventFormLeftActionVisibility } from '@/lib/agenda/agendaEventFormLeftActionsHelpers';

interface AgendaEventFormLeftActionSlotsProps {
	permissions: AgendaEventFormPermissions;
	state: AgendaEventFormFooterState;
	isBusy: boolean;
	onDeleteClick: () => void;
	onOpenCancelConfirm?: () => void;
	onCancelLesson?: () => void;
	onMarkTrialCompleted?: () => void | Promise<void>;
}

export function AgendaEventDeleteActionSlot({
	permissions,
	isBusy,
	onDeleteClick,
}: Pick<AgendaEventFormLeftActionSlotsProps, 'permissions' | 'isBusy' | 'onDeleteClick'>) {
	if (!permissions.canDelete) return null;
	return <AgendaEventDeleteAction disabled={isBusy} onClick={onDeleteClick} />;
}

export function AgendaEventCancelLessonActionSlot({
	permissions,
	state,
	isBusy,
	onOpenCancelConfirm,
}: Pick<AgendaEventFormLeftActionSlotsProps, 'permissions' | 'state' | 'isBusy' | 'onOpenCancelConfirm'>) {
	const visibility = resolveAgendaEventFormLeftActionVisibility(
		permissions,
		onOpenCancelConfirm !== undefined,
		false,
		false,
	);
	if (!visibility.showCancelLesson || !onOpenCancelConfirm) return null;
	return (
		<AgendaEventCancelLessonAction
			disabled={isBusy}
			isCancelling={state.isCancelling}
			onClick={onOpenCancelConfirm}
		/>
	);
}

export function AgendaEventRestoreLessonActionSlot({
	permissions,
	state,
	isBusy,
	onCancelLesson,
}: Pick<AgendaEventFormLeftActionSlotsProps, 'permissions' | 'state' | 'isBusy' | 'onCancelLesson'>) {
	const visibility = resolveAgendaEventFormLeftActionVisibility(
		permissions,
		false,
		onCancelLesson !== undefined,
		false,
	);
	if (!visibility.showRestoreLesson || !onCancelLesson) return null;
	return (
		<AgendaEventRestoreLessonAction disabled={isBusy} isCancelling={state.isCancelling} onClick={onCancelLesson} />
	);
}

export function AgendaEventMarkTrialCompletedActionSlot({
	permissions,
	state,
	isBusy,
	onMarkTrialCompleted,
}: Pick<AgendaEventFormLeftActionSlotsProps, 'permissions' | 'state' | 'isBusy' | 'onMarkTrialCompleted'>) {
	const visibility = resolveAgendaEventFormLeftActionVisibility(
		permissions,
		false,
		false,
		onMarkTrialCompleted !== undefined,
	);
	if (!visibility.showMarkTrialCompleted || !onMarkTrialCompleted) return null;
	return (
		<AgendaEventMarkTrialCompletedAction
			disabled={isBusy || state.isMarkingTrialCompleted}
			isMarkingTrialCompleted={state.isMarkingTrialCompleted}
			onClick={() => void onMarkTrialCompleted()}
		/>
	);
}
