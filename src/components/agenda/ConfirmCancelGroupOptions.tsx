import { getDisplayName } from '@/lib/display-name';
import type { User } from '@/types/users';

interface ConfirmCancelGroupOptionsProps {
	participants: User[];
	selectedIds: string[];
	cancelAll: boolean;
	onCancelAllChange: (checked: boolean) => void;
	onToggleParticipant: (id: string) => void;
}

function ConfirmCancelParticipantPicker({
	participants,
	selectedIds,
	onToggle,
}: {
	participants: User[];
	selectedIds: string[];
	onToggle: (id: string) => void;
}) {
	return (
		<div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
			<p className="text-xs text-muted-foreground">Deelnemers die afzeggen:</p>
			{participants.map((participant) => (
				<label key={participant.user_id} className="flex items-center gap-2 cursor-pointer text-sm">
					<input
						type="checkbox"
						checked={selectedIds.includes(participant.user_id)}
						onChange={() => onToggle(participant.user_id)}
						className="h-4 w-4"
					/>
					<span>{getDisplayName(participant)}</span>
				</label>
			))}
		</div>
	);
}

export function ConfirmCancelGroupOptions({
	participants,
	selectedIds,
	cancelAll,
	onCancelAllChange,
	onToggleParticipant,
}: ConfirmCancelGroupOptionsProps) {
	return (
		<div className="space-y-3 py-2">
			<label className="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={cancelAll}
					onChange={(event) => onCancelAllChange(event.target.checked)}
					className="h-4 w-4"
				/>
				<span className="text-sm font-medium">Hele les annuleren</span>
			</label>
			{!cancelAll && (
				<ConfirmCancelParticipantPicker
					participants={participants}
					selectedIds={selectedIds}
					onToggle={onToggleParticipant}
				/>
			)}
		</div>
	);
}
