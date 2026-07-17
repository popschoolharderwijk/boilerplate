export function getLessonGroupMembersPlaceholder(eligibleStudentCount: number): string {
	return eligibleStudentCount === 0 ? 'Geen leerlingen aangemeld voor deze lessoort' : 'Voeg leerlingen toe...';
}

export function formatLessonGroupMemberCount(count: number): string {
	const noun = count === 1 ? 'leerling' : 'leerlingen';
	return `Geselecteerd: ${count} ${noun}`;
}

export function formatIndicativeLessonRevenue(memberCount: number, pricePerLesson: number): string | null {
	if (memberCount === 0 || pricePerLesson <= 0) return null;
	return (memberCount * pricePerLesson).toLocaleString('nl-NL', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function toggleSelectedRequestId(selectedIds: string[], requestId: string, checked: boolean): string[] {
	if (checked) return [...selectedIds, requestId];
	return selectedIds.filter((id) => id !== requestId);
}
