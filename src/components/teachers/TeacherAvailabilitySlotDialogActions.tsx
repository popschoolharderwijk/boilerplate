import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface TeacherAvailabilitySlotDialogActionsProps {
	isEditing: boolean;
	onClose: () => void;
	onSave: () => void;
	onAdd: () => void;
}

export function TeacherAvailabilitySlotDialogActions({
	isEditing,
	onClose,
	onSave,
	onAdd,
}: TeacherAvailabilitySlotDialogActionsProps) {
	return (
		<DialogFooter>
			<Button variant="outline" onClick={onClose}>
				Annuleren
			</Button>
			{isEditing ? <Button onClick={onSave}>Opslaan</Button> : <Button onClick={onAdd}>Toevoegen</Button>}
		</DialogFooter>
	);
}

interface TeacherAvailabilitySlotDeleteButtonProps {
	onDelete: () => void;
}

export function TeacherAvailabilitySlotDeleteButton({ onDelete }: TeacherAvailabilitySlotDeleteButtonProps) {
	return (
		<Button variant="destructive" className="w-full" onClick={onDelete}>
			Verwijder tijdslot
		</Button>
	);
}
