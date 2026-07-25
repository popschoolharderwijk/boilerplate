interface ParticipantProfile {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

export interface ParticipantBadgeState {
	label: string;
	isOwner: boolean;
	isLessonParticipant: boolean;
	canRemove: boolean;
	useSelfLabel: boolean;
}

export function resolveParticipantBadgeState(params: {
	id: string;
	currentUserId: string | undefined;
	effectiveOwnerId: string | undefined;
	profile: ParticipantProfile | undefined;
	readonlyParticipantIds: string[];
	isCancelledEvent: boolean;
	displayName: string;
}): ParticipantBadgeState {
	const useSelfLabel = params.id === params.currentUserId;
	const isOwner = params.id === params.effectiveOwnerId;
	const isReadonly = params.readonlyParticipantIds.includes(params.id);
	const isLessonParticipant = isReadonly && !isOwner;
	const canRemove = !isOwner && !isReadonly && !params.isCancelledEvent;
	const label = useSelfLabel ? 'Jij' : params.profile ? params.displayName : '…';

	return {
		label,
		isOwner,
		isLessonParticipant,
		canRemove,
		useSelfLabel,
	};
}
