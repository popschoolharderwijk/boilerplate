import { LessonAgreementItem } from '@/components/students/LessonAgreementItem';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getDisplayName } from '@/lib/display-name';
import { formatAgreementCount } from '@/lib/students/studentsPageHelpers';
import type { StudentWithAgreements } from '@/types/students';

interface StudentDeleteDialogProps {
	deleteDialog: {
		open: boolean;
		student: StudentWithAgreements;
		deleteUser: boolean;
	} | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
	onDeleteUserChange: (deleteUser: boolean) => void;
}

export function StudentDeleteDialog({
	deleteDialog,
	onOpenChange,
	onConfirm,
	onDeleteUserChange,
}: StudentDeleteDialogProps) {
	if (!deleteDialog) return null;

	return (
		<ConfirmDeleteDialog
			open={deleteDialog.open}
			onOpenChange={onOpenChange}
			title="Leerling verwijderen"
			description={
				<>
					Weet je zeker dat je <strong>{getDisplayName(deleteDialog.student) || 'deze leerling'}</strong> wilt
					verwijderen? Deze actie kan niet ongedaan worden gemaakt.
				</>
			}
			onConfirm={onConfirm}
			extraContent={
				<>
					<p className="text-sm text-muted-foreground">
						Alle gegevens van deze leerling worden permanent verwijderd, inclusief{' '}
						{formatAgreementCount(deleteDialog.student.agreements.length)}.
					</p>
					{deleteDialog.student.agreements.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium">De volgende lesovereenkomsten worden verwijderd:</p>
							<div className="max-h-60 overflow-y-auto rounded-md border p-3 space-y-2">
								{deleteDialog.student.agreements.map((agreement) => (
									<LessonAgreementItem
										key={agreement.id}
										agreement={agreement}
										className="w-full"
										readOnly
									/>
								))}
							</div>
						</div>
					)}
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="delete-user"
							checked={deleteDialog.deleteUser}
							onChange={(e) => onDeleteUserChange(e.target.checked)}
							className="h-4 w-4 rounded border-gray-300"
						/>
						<label htmlFor="delete-user" className="text-sm font-medium">
							Ook de gebruiker verwijderen
						</label>
					</div>
				</>
			}
		/>
	);
}
