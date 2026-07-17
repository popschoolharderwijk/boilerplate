export interface ParticipantProfileRow {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

export interface ParticipantProfile {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

function mapParticipantProfileRow(row: ParticipantProfileRow): [string, ParticipantProfile] {
	return [
		row.user_id,
		{
			first_name: row.first_name ?? null,
			last_name: row.last_name ?? null,
			email: row.email ?? null,
		},
	];
}

export function extractParticipantUserIds(rows: { user_id: string }[]): string[] {
	return rows.map((participant) => participant.user_id);
}

export function buildParticipantProfileMap(
	rows: ParticipantProfileRow[] | null | undefined,
): Record<string, ParticipantProfile> {
	return Object.fromEntries((rows ?? []).map(mapParticipantProfileRow));
}

export function shouldUseOccurrenceParticipantIds(
	participantIds: string[] | null | undefined,
): participantIds is string[] {
	return Boolean(participantIds && participantIds.length > 0);
}

export function shouldClearParticipantProfiles(open: boolean, participantCount: number): boolean {
	return !open || participantCount === 0;
}
