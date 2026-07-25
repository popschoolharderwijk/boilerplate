import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { SubmitButton } from '@/components/ui/submit-button';

interface FormDialogFooterProps {
	onCancel: () => void;
	onSave: () => void;
	saving: boolean;
	disabled?: boolean;
	isEditing: boolean;
}

export function FormDialogFooter({ onCancel, onSave, saving, disabled, isEditing }: FormDialogFooterProps) {
	return (
		<DialogFooter>
			<Button variant="outline" onClick={onCancel}>
				Annuleren
			</Button>
			<SubmitButton onClick={onSave} loading={saving} disabled={disabled}>
				{isEditing ? 'Opslaan' : 'Aanmaken'}
			</SubmitButton>
		</DialogFooter>
	);
}
