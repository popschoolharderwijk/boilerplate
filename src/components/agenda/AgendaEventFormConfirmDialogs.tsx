import { RecurrenceChoiceDialog, type RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

interface AgendaEventFormConfirmDialogsProps {
	eventTitle?: string;
	deleteConfirmOpen: boolean;
	setDeleteConfirmOpen: (open: boolean) => void;
	deleteRecurrenceOpen: boolean;
	setDeleteRecurrenceOpen: (open: boolean) => void;
	editRecurrenceOpen: boolean;
	setEditRecurrenceOpen: (open: boolean) => void;
	onDeleteConfirm: () => void | Promise<void>;
	onDeleteRecurrence: (scope: RecurrenceScope) => void;
	onEditRecurrence: (scope: RecurrenceScope) => void;
}

export function AgendaEventFormConfirmDialogs({
	eventTitle,
	deleteConfirmOpen,
	setDeleteConfirmOpen,
	deleteRecurrenceOpen,
	setDeleteRecurrenceOpen,
	editRecurrenceOpen,
	setEditRecurrenceOpen,
	onDeleteConfirm,
	onDeleteRecurrence,
	onEditRecurrence,
}: AgendaEventFormConfirmDialogsProps) {
	return (
		<>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Afspraak verwijderen"
				description={
					<>
						<strong>{eventTitle}</strong> wilt verwijderen?
						<p className="mt-2 text-muted-foreground">Deze actie kan niet ongedaan worden gemaakt.</p>
					</>
				}
				onConfirm={async () => {
					await onDeleteConfirm();
				}}
			/>
			<RecurrenceChoiceDialog
				open={deleteRecurrenceOpen}
				onOpenChange={setDeleteRecurrenceOpen}
				action="delete"
				onChoose={onDeleteRecurrence}
			/>
			<RecurrenceChoiceDialog
				open={editRecurrenceOpen}
				onOpenChange={setEditRecurrenceOpen}
				action="edit"
				onChoose={onEditRecurrence}
			/>
		</>
	);
}
