import { type FormEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { AgendaEventFormPermissions } from '@/components/agenda/agenda-event-form-types';
import {
	executeAgendaDelete,
	getAgendaRevertErrorMessage,
	resolveAgendaDeleteClickAction,
	resolveAgendaFormSubmitAction,
} from '@/components/agenda/agendaEventFormActionHelpers';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { DeleteScope } from '@/types/agenda-events';

interface UseAgendaEventFormActionsParams {
	userId: string | undefined;
	eventId: string | undefined;
	selectedProjectId: string | null;
	isProjectEvent: boolean;
	occurrenceDate?: string | null;
	startDate: string | null;
	startTime: string;
	permissions: AgendaEventFormPermissions;
	onDelete?: (eventId: string, scope: DeleteScope, occurrenceDate?: string) => void | Promise<void>;
	onRevert?: () => void | Promise<void>;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	performSave: (scope: RecurrenceScope) => Promise<void>;
}

export function useAgendaEventFormActions({
	userId,
	eventId,
	selectedProjectId,
	isProjectEvent,
	occurrenceDate,
	startDate,
	startTime,
	permissions,
	onDelete,
	onRevert,
	onOpenChange,
	onSuccess,
	performSave,
}: UseAgendaEventFormActionsParams) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteRecurrenceOpen, setDeleteRecurrenceOpen] = useState(false);
	const [editRecurrenceOpen, setEditRecurrenceOpen] = useState(false);
	const [reverting, setReverting] = useState(false);

	const { canDelete, canRevert, isRecurringEvent } = permissions;

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			const action = resolveAgendaFormSubmitAction({
				userId,
				startDate,
				startTime,
				isProjectEvent,
				selectedProjectId,
				eventId,
				isRecurringEvent,
			});
			if (action === 'missing-fields') return;
			if (action === 'missing-project') {
				toast.error('Selecteer een project');
				return;
			}
			if (action === 'open-recurrence') {
				setEditRecurrenceOpen(true);
				return;
			}
			await performSave('all');
		},
		[userId, startDate, startTime, isProjectEvent, selectedProjectId, eventId, isRecurringEvent, performSave],
	);

	const handleDeleteClick = useCallback(() => {
		const action = resolveAgendaDeleteClickAction({ canDelete, eventId, isRecurringEvent });
		if (action === 'noop') return;
		if (action === 'open-recurrence') {
			setDeleteRecurrenceOpen(true);
			return;
		}
		setDeleteConfirmOpen(true);
	}, [canDelete, eventId, isRecurringEvent]);

	const handleDeleteConfirm = useCallback(async () => {
		await executeAgendaDelete({
			canDelete,
			eventId,
			onDelete,
			scope: 'all',
			onOpenChange,
			onSuccess,
		});
	}, [canDelete, eventId, onDelete, onOpenChange, onSuccess]);

	const handleDeleteRecurrence = useCallback(
		async (scope: RecurrenceScope) => {
			await executeAgendaDelete({
				canDelete,
				eventId,
				onDelete,
				scope,
				occurrenceDate: occurrenceDate ?? undefined,
				onOpenChange,
				onSuccess,
			});
		},
		[canDelete, eventId, onDelete, occurrenceDate, onOpenChange, onSuccess],
	);

	const handleRevert = useCallback(async () => {
		if (!canRevert || !onRevert) return;
		setReverting(true);
		try {
			await onRevert();
			onOpenChange(false);
		} catch (err) {
			toast.error(getAgendaRevertErrorMessage(err));
		} finally {
			setReverting(false);
		}
	}, [canRevert, onRevert, onOpenChange]);

	return {
		deleteConfirmOpen,
		setDeleteConfirmOpen,
		deleteRecurrenceOpen,
		setDeleteRecurrenceOpen,
		editRecurrenceOpen,
		setEditRecurrenceOpen,
		reverting,
		handleSubmit,
		handleDeleteClick,
		handleDeleteConfirm,
		handleDeleteRecurrence,
		handleRevert,
	};
}
