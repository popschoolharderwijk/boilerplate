import { LuLoaderCircle, LuTriangleAlert } from 'react-icons/lu';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { frequencyLabels } from '@/lib/frequencies';
import type { OptionRowWithKey } from '@/pages/lesson-type-info/types';

interface LessonTypeOptionDeleteDialogProps {
	optionToDelete: OptionRowWithKey;
	onClose: () => void;
	onConfirm: () => void;
	saving: boolean;
}

export function LessonTypeOptionDeleteDialog({
	optionToDelete,
	onClose,
	onConfirm,
	saving,
}: LessonTypeOptionDeleteDialogProps) {
	return (
		<AlertDialog open onOpenChange={(open) => !open && onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-destructive/10 text-destructive">
						<LuTriangleAlert className="h-6 w-6" />
					</AlertDialogMedia>
					<AlertDialogTitle>Lesoptie verwijderen</AlertDialogTitle>
					<AlertDialogDescription>
						Weet je zeker dat je deze optie (
						<strong>
							{optionToDelete.duration_minutes} min, {frequencyLabels[optionToDelete.frequency]}
						</strong>
						) wilt verwijderen?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel asChild>
						<Button variant="outline" disabled={saving}>
							Annuleren
						</Button>
					</AlertDialogCancel>
					<Button variant="destructive" onClick={onConfirm} disabled={saving}>
						{saving ? (
							<>
								<LuLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
								Verwijderen...
							</>
						) : (
							'Verwijderen'
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
