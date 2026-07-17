import { ConfirmCancelDialogFooter } from '@/components/agenda/ConfirmCancelDialogFooter';
import { ConfirmCancelGroupOptions } from '@/components/agenda/ConfirmCancelGroupOptions';
import { ConfirmCancelTypeOptions } from '@/components/agenda/ConfirmCancelTypeOptions';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConfirmCancelDialogState } from '@/hooks/useConfirmCancelDialogState';
import type { CancellationType } from '@/types/agenda-events';
import type { User } from '@/types/users';

interface ConfirmCancelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (cancellationType: CancellationType, cancelledParticipantIds: string[] | null) => void;
	disabled?: boolean;
	participants?: User[];
	initialCancelledIds?: string[] | null;
}

function ConfirmCancelDialogDescription({ isGroup }: { isGroup: boolean }) {
	return (
		<AlertDialogDescription>
			{isGroup
				? 'Kies welke deelnemers afzeggen, of annuleer de hele les.'
				: 'Geef aan wie de les heeft afgezegd. Bij afzegging door de docent wordt de les gemarkeerd als "inhalen vereist".'}
		</AlertDialogDescription>
	);
}

export function ConfirmCancelDialog({
	open,
	onOpenChange,
	onConfirm,
	disabled = false,
	participants,
	initialCancelledIds,
}: ConfirmCancelDialogProps) {
	const isGroup = Boolean(participants?.length);
	const { cancellationType, selectedIds, cancelAll, setCancellationType, setCancelAll, toggleParticipant } =
		useConfirmCancelDialogState(open, isGroup, initialCancelledIds);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Les annuleren?</AlertDialogTitle>
					<ConfirmCancelDialogDescription isGroup={isGroup} />
				</AlertDialogHeader>

				{isGroup && participants && (
					<ConfirmCancelGroupOptions
						participants={participants}
						selectedIds={selectedIds}
						cancelAll={cancelAll}
						onCancelAllChange={setCancelAll}
						onToggleParticipant={toggleParticipant}
					/>
				)}

				<ConfirmCancelTypeOptions
					isGroup={isGroup}
					cancelAll={cancelAll}
					cancellationType={cancellationType}
					onCancellationTypeChange={setCancellationType}
				/>

				<AlertDialogFooter>
					<ConfirmCancelDialogFooter
						disabled={disabled}
						isGroup={isGroup}
						cancelAll={cancelAll}
						selectedIds={selectedIds}
						cancellationType={cancellationType}
						onOpenChange={onOpenChange}
						onConfirm={onConfirm}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
