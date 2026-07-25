export function getDefaultExpandedAnnouncementIds(announcementIds: string[]): Set<string> {
	if (announcementIds.length === 0) return new Set();
	return new Set([announcementIds[0]]);
}

export function toggleExpandedAnnouncementId(expanded: Set<string>, id: string): Set<string> {
	const next = new Set(expanded);
	if (next.has(id)) {
		next.delete(id);
		return next;
	}
	next.add(id);
	return next;
}
