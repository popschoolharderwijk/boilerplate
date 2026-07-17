import { ParticipantBadge } from '@/components/agenda/ParticipantBadge';
import { Label } from '@/components/ui/label';
import { UserSelectSingle } from '@/components/ui/user-select';

interface ParticipantProfile {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

interface AgendaEventFormParticipantsProps {
	participantIds: string[];
	participantProfiles: Record<string, ParticipantProfile>;
	participantAddId: string | null;
	setParticipantAddId: (value: string | null) => void;
	onAddParticipant: (userId: string) => void;
	onRemoveParticipant: (userId: string) => void;
	ownerUserId: string | undefined;
	currentUserId: string | undefined;
	readonlyParticipantIds: string[];
	canAddParticipants: boolean;
	isCancelledEvent: boolean;
	onCloseDialog: () => void;
}

export function AgendaEventFormParticipants({
	participantIds,
	participantProfiles,
	participantAddId,
	setParticipantAddId,
	onAddParticipant,
	onRemoveParticipant,
	ownerUserId,
	currentUserId,
	readonlyParticipantIds,
	canAddParticipants,
	isCancelledEvent,
	onCloseDialog,
}: AgendaEventFormParticipantsProps) {
	const effectiveOwnerId = ownerUserId ?? currentUserId;
	const hasOtherParticipants = participantIds.some((id) => id !== effectiveOwnerId);

	return (
		<div>
			{hasOtherParticipants && (
				<>
					<Label>Deelnemers</Label>
					<div className="flex flex-wrap gap-2 mt-1 mb-2">
						{participantIds.map((id) => (
							<ParticipantBadge
								key={id}
								id={id}
								currentUserId={currentUserId}
								effectiveOwnerId={effectiveOwnerId}
								profile={participantProfiles[id]}
								readonlyParticipantIds={readonlyParticipantIds}
								isCancelledEvent={isCancelledEvent}
								onRemoveParticipant={onRemoveParticipant}
								onCloseDialog={onCloseDialog}
							/>
						))}
					</div>
				</>
			)}
			{canAddParticipants && (
				<UserSelectSingle
					value={participantAddId}
					onChange={(user) => {
						if (user) onAddParticipant(user.user_id);
						setParticipantAddId(null);
					}}
					disabled={isCancelledEvent}
					filter="all"
					excludeUserIds={participantIds}
					placeholder="Deelnemer toevoegen..."
				/>
			)}
		</div>
	);
}
