import { AgendaEventFormLeftActions } from '@/components/agenda/AgendaEventFormLeftActions';
import type { AgendaEventFormPermissions } from '@/components/agenda/agenda-event-form-types';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
	type AgendaEventFormFooterState,
	getCloseButtonLabel,
	getFooterLayoutClass,
	getSubmitButtonLabel,
	hasLeftFooterActions,
	isSubmitDisabled,
} from '@/lib/agenda/agendaEventFormFooterHelpers';

interface AgendaEventFormFooterProps {
	permissions: AgendaEventFormPermissions;
	saving: boolean;
	reverting: boolean;
	isCancelling: boolean;
	isMarkingTrialCompleted: boolean;
	hasChanges: boolean;
	isEditing: boolean;
	onDeleteClick: () => void;
	onOpenCancelConfirm?: () => void;
	onCancelLesson?: () => void;
	onMarkTrialCompleted?: () => void | Promise<void>;
	onClose: () => void;
}

export function AgendaEventFormFooter({
	permissions,
	saving,
	reverting,
	isCancelling,
	isMarkingTrialCompleted,
	hasChanges,
	isEditing,
	onDeleteClick,
	onOpenCancelConfirm,
	onCancelLesson,
	onMarkTrialCompleted,
	onClose,
}: AgendaEventFormFooterProps) {
	const { isCancelledEvent } = permissions;
	const state: AgendaEventFormFooterState = {
		saving,
		reverting,
		isCancelling,
		isMarkingTrialCompleted,
		hasChanges,
		isEditing,
	};

	return (
		<DialogFooter className={getFooterLayoutClass(hasLeftFooterActions(permissions))}>
			<AgendaEventFormLeftActions
				permissions={permissions}
				state={state}
				onDeleteClick={onDeleteClick}
				onOpenCancelConfirm={onOpenCancelConfirm}
				onCancelLesson={onCancelLesson}
				onMarkTrialCompleted={onMarkTrialCompleted}
			/>
			<div className="flex gap-2">
				<Button type="button" variant="outline" onClick={onClose}>
					{getCloseButtonLabel(isCancelledEvent)}
				</Button>
				{!isCancelledEvent && (
					<Button type="submit" disabled={isSubmitDisabled(state, isCancelledEvent)}>
						{getSubmitButtonLabel(saving, isEditing)}
					</Button>
				)}
			</div>
		</DialogFooter>
	);
}
