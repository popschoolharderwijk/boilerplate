import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface LegacyImportConfirmDialogProps {
	open: boolean;
	busy: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function LegacyImportConfirmDialog({ open, busy, onOpenChange, onConfirm }: LegacyImportConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Import bevestigen</DialogTitle>
					<DialogDescription>
						De import is idempotent maar wijzigt productiedata. Bestaande records worden bijgewerkt.
						Doorgaan?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
						Annuleren
					</Button>
					<Button onClick={onConfirm} disabled={busy}>
						Ja, importeren
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
