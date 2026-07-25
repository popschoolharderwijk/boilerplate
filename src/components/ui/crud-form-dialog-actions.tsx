import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { FormDialogFooter } from '@/components/ui/form-dialog-footer';

export interface CrudFormDialogActionsProps {
	onCancel: () => void;
	onSave: () => void;
	saving: boolean;
	disabled?: boolean;
	isEditing: boolean;
	deleteOpen: boolean;
	onDeleteOpenChange: (open: boolean) => void;
	onDeleteConfirm: () => void | Promise<void>;
	deleteTitle: string;
	deleteDescription: string;
}

export function CrudFormDialogActions({
	onCancel,
	onSave,
	saving,
	disabled,
	isEditing,
	deleteOpen,
	onDeleteOpenChange,
	onDeleteConfirm,
	deleteTitle,
	deleteDescription,
}: CrudFormDialogActionsProps) {
	return (
		<>
			<FormDialogFooter
				onCancel={onCancel}
				onSave={onSave}
				saving={saving}
				disabled={disabled}
				isEditing={isEditing}
			/>
			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={onDeleteOpenChange}
				onConfirm={async () => {
					await onDeleteConfirm();
				}}
				title={deleteTitle}
				description={deleteDescription}
			/>
		</>
	);
}
