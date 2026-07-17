import {
	ParticipantBadgeLabel,
	ParticipantBadgeMeta,
	ParticipantBadgeRemoveButton,
} from '@/components/agenda/ParticipantBadgeParts';
import { Badge } from '@/components/ui/badge';
import { resolveParticipantBadgeState } from '@/lib/agenda/agendaEventFormParticipantsHelpers';
import { getDisplayName } from '@/lib/display-name';

interface ParticipantProfile {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

export interface ParticipantBadgeProps {
	id: string;
	currentUserId: string | undefined;
	effectiveOwnerId: string | undefined;
	profile: ParticipantProfile | undefined;
	readonlyParticipantIds: string[];
	isCancelledEvent: boolean;
	onRemoveParticipant: (userId: string) => void;
	onCloseDialog: () => void;
}

export function ParticipantBadge({
	id,
	currentUserId,
	effectiveOwnerId,
	profile,
	readonlyParticipantIds,
	isCancelledEvent,
	onRemoveParticipant,
	onCloseDialog,
}: ParticipantBadgeProps) {
	const displayName = profile ? getDisplayName(profile) : '…';
	const badgeState = resolveParticipantBadgeState({
		id,
		currentUserId,
		effectiveOwnerId,
		profile,
		readonlyParticipantIds,
		isCancelledEvent,
		displayName,
	});

	return (
		<Badge variant="secondary" className="gap-1">
			<ParticipantBadgeLabel badgeState={badgeState} id={id} onCloseDialog={onCloseDialog} />
			<ParticipantBadgeMeta badgeState={badgeState} />
			<ParticipantBadgeRemoveButton
				id={id}
				canRemove={badgeState.canRemove}
				onRemoveParticipant={onRemoveParticipant}
			/>
		</Badge>
	);
}
