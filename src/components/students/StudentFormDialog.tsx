import { StudentFormFields } from '@/components/students/StudentFormFields';
import { useStudentFormDialog } from '@/components/students/useStudentFormDialog';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Student } from '@/types/students';

interface StudentFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	/** Student data for edit mode. If undefined, dialog is in create mode. */
	student?: Student;
}

export function StudentFormDialog({ open, onOpenChange, onSuccess, student }: StudentFormDialogProps) {
	const vm = useStudentFormDialog({ open, onOpenChange, onSuccess, student });

	return (
		<Dialog open={open} onOpenChange={vm.handleOpenChange}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader className="pb-2">
					<DialogTitle className="text-lg">{vm.dialogTitle}</DialogTitle>
					{vm.dialogDescription && (
						<DialogDescription className="text-sm">{vm.dialogDescription}</DialogDescription>
					)}
				</DialogHeader>
				<StudentFormFields vm={vm} />
				<DialogFooter>
					<Button variant="outline" onClick={vm.handleCancel} disabled={vm.saving}>
						Annuleren
					</Button>
					<SubmitButton onClick={() => vm.runFormAction()} loading={vm.saving} loadingLabel={vm.savingLabel}>
						{vm.submitLabel}
					</SubmitButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
