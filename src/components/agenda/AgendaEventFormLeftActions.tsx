import {
	AgendaEventCancelLessonActionSlot,
	AgendaEventDeleteActionSlot,
	AgendaEventMarkTrialCompletedActionSlot,
	AgendaEventRestoreLessonActionSlot,
} from '@/components/agenda/AgendaEventFormLeftActionSlots';
import type { AgendaEventFormPermissions } from '@/components/agenda/agenda-event-form-types';
import { type AgendaEventFormFooterState, isFooterBusy } from '@/lib/agenda/agendaEventFormFooterHelpers';

interface AgendaEventFormLeftActionsProps {
	permissions: AgendaEventFormPermissions;
	state: AgendaEventFormFooterState;
	onDeleteClick: () => void;
	onOpenCancelConfirm?: () => void;
	onCancelLesson?: () => void;
	onMarkTrialCompleted?: () => void | Promise<void>;
}

export function AgendaEventFormLeftActions({
	permissions,
	state,
	onDeleteClick,
	onOpenCancelConfirm,
	onCancelLesson,
	onMarkTrialCompleted,
}: AgendaEventFormLeftActionsProps) {
	const isBusy = isFooterBusy(state);

	return (
		<div className="flex gap-2 order-last sm:order-none">
			<AgendaEventDeleteActionSlot permissions={permissions} isBusy={isBusy} onDeleteClick={onDeleteClick} />
			<AgendaEventCancelLessonActionSlot
				permissions={permissions}
				state={state}
				isBusy={isBusy}
				onOpenCancelConfirm={onOpenCancelConfirm}
			/>
			<AgendaEventRestoreLessonActionSlot
				permissions={permissions}
				state={state}
				isBusy={isBusy}
				onCancelLesson={onCancelLesson}
			/>
			<AgendaEventMarkTrialCompletedActionSlot
				permissions={permissions}
				state={state}
				isBusy={isBusy}
				onMarkTrialCompleted={onMarkTrialCompleted}
			/>
		</div>
	);
}
