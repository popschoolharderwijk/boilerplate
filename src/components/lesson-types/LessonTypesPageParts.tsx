import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

interface LessonTypesDeleteDialogProps {
	deleteDialog: { open: boolean; lessonType: { id: string; name: string } | null } | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
}

export function LessonTypesDeleteDialog({ deleteDialog, onOpenChange, onConfirm }: LessonTypesDeleteDialogProps) {
	if (!deleteDialog) return null;

	return (
		<ConfirmDeleteDialog
			open={deleteDialog.open}
			onOpenChange={onOpenChange}
			title="Lessoort verwijderen"
			description={
				<>
					Weet je zeker dat je <strong>{deleteDialog.lessonType?.name}</strong> wilt verwijderen? Deze actie
					kan niet ongedaan worden gemaakt.
					<p className="mt-2 text-muted-foreground">
						Alle gegevens van deze lessoort worden permanent verwijderd.
					</p>
				</>
			}
			onConfirm={onConfirm}
		/>
	);
}
