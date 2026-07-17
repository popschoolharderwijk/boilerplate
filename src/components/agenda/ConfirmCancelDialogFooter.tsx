import { AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { canConfirmCancel, handleConfirmCancelSelection } from '@/lib/agenda/confirmCancelDialogHelpers';
import type { CancellationType } from '@/types/agenda-events';

interface ConfirmCancelDialogFooterProps {
	disabled: boolean;
	isGroup: boolean;
	cancelAll: boolean;
	selectedIds: string[];
	cancellationType: CancellationType;
	onOpenChange: (open: boolean) => void;
	onConfirm: (cancellationType: CancellationType, cancelledParticipantIds: string[] | null) => void;
}

export function ConfirmCancelDialogFooter({
	disabled,
	isGroup,
	cancelAll,
	selectedIds,
	cancellationType,
	onOpenChange,
	onConfirm,
}: ConfirmCancelDialogFooterProps) {
	return (
		<>
			<AlertDialogCancel asChild>
				<Button variant="outline" disabled={disabled}>
					Nee
				</Button>
			</AlertDialogCancel>
			<Button
				variant="destructive"
				onClick={() =>
					handleConfirmCancelSelection(
						onOpenChange,
						onConfirm,
						isGroup,
						cancelAll,
						selectedIds,
						cancellationType,
					)
				}
				disabled={disabled || !canConfirmCancel(isGroup, cancelAll, selectedIds)}
			>
				{disabled ? <LoadingSpinner size="md" label="Bezig..." /> : 'Ja, annuleren'}
			</Button>
		</>
	);
}
