import { LuTriangleAlert } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import type { SlotWithStatus } from '@/lib/agreementSlots';
import { formatPartialSlotOccupancySuffix } from '@/lib/agreements/partialSlotConfirmDialogHelpers';

interface PartialSlotConfirmDialogProps {
	open: boolean;
	slot: SlotWithStatus | null;
	onCancel: () => void;
	onConfirm: () => void;
}

export function PartialSlotConfirmDialog({ open, slot, onCancel, onConfirm }: PartialSlotConfirmDialogProps) {
	if (!open) return null;

	const occupancySuffix = formatPartialSlotOccupancySuffix(slot);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
				<div className="flex items-center gap-2 mb-4">
					<LuTriangleAlert className="h-5 w-5 text-amber-500" />
					<h3 className="text-lg font-semibold">Deels bezet tijdslot</h3>
				</div>
				<p className="text-muted-foreground mb-6">
					Dit tijdslot is deels bezet in de gekozen periode{occupancySuffix}. Weet je zeker dat je dit
					tijdslot wilt gebruiken?
				</p>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onCancel}>
						Annuleren
					</Button>
					<Button onClick={onConfirm}>Toch gebruiken</Button>
				</div>
			</div>
		</div>
	);
}
