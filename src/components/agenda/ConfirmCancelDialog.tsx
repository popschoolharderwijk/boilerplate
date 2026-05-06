import { useEffect, useState } from 'react';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getDisplayName } from '@/lib/display-name';
import type { CancellationType } from '@/types/agenda-events';
import type { User } from '@/types/users';

interface ConfirmCancelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (cancellationType: CancellationType, cancelledParticipantIds: string[] | null) => void;
	disabled?: boolean;
	/** When provided, show per-participant checkboxes (group lesson) */
	participants?: User[];
	/** Already-cancelled participant ids (pre-selected) */
	initialCancelledIds?: string[] | null;
}

export function ConfirmCancelDialog({
	open,
	onOpenChange,
	onConfirm,
	disabled = false,
	participants,
	initialCancelledIds,
}: ConfirmCancelDialogProps) {
	const [cancellationType, setCancellationType] = useState<CancellationType>('student');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [cancelAll, setCancelAll] = useState(false);

	const isGroup = !!participants && participants.length > 0;

	useEffect(() => {
		if (!open) return;
		setCancellationType('student');
		setSelectedIds(initialCancelledIds ?? []);
		setCancelAll(!isGroup);
	}, [open, initialCancelledIds, isGroup]);

	const toggleParticipant = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
	};

	const canConfirm = !isGroup || cancelAll || selectedIds.length > 0;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Les annuleren?</AlertDialogTitle>
					<AlertDialogDescription>
						{isGroup
							? 'Kies welke deelnemers afzeggen, of annuleer de hele les.'
							: 'Geef aan wie de les heeft afgezegd. Bij afzegging door de docent wordt de les gemarkeerd als "inhalen vereist".'}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{isGroup && (
					<div className="space-y-3 py-2">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={cancelAll}
								onChange={(e) => setCancelAll(e.target.checked)}
								className="h-4 w-4"
							/>
							<span className="text-sm font-medium">Hele les annuleren</span>
						</label>
						{!cancelAll && (
							<div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
								<p className="text-xs text-muted-foreground">Deelnemers die afzeggen:</p>
								{participants?.map((p) => (
									<label key={p.user_id} className="flex items-center gap-2 cursor-pointer text-sm">
										<input
											type="checkbox"
											checked={selectedIds.includes(p.user_id)}
											onChange={() => toggleParticipant(p.user_id)}
											className="h-4 w-4"
										/>
										<span>{getDisplayName(p)}</span>
									</label>
								))}
							</div>
						)}
					</div>
				)}

				<RadioGroup
					value={cancellationType}
					onValueChange={(val) => setCancellationType(val as CancellationType)}
					className="gap-3 py-2"
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="student" id="cancel-student" />
						<Label htmlFor="cancel-student" className="cursor-pointer">
							{isGroup && !cancelAll ? 'Deelnemer(s) hebben afgezegd' : 'Leerling heeft afgezegd'}
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="teacher" id="cancel-teacher" disabled={isGroup && !cancelAll} />
						<Label
							htmlFor="cancel-teacher"
							className={`cursor-pointer ${isGroup && !cancelAll ? 'text-muted-foreground' : ''}`}
						>
							Docent kan niet (inhalen vereist)
						</Label>
					</div>
				</RadioGroup>
				<AlertDialogFooter>
					<AlertDialogCancel asChild>
						<Button variant="outline" disabled={disabled}>
							Nee
						</Button>
					</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={() => {
							onOpenChange(false);
							onConfirm(cancellationType, isGroup && !cancelAll ? selectedIds : null);
						}}
						disabled={disabled || !canConfirm}
					>
						{disabled ? <LoadingSpinner size="md" label="Bezig..." /> : 'Ja, annuleren'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
