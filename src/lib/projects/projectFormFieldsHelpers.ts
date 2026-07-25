export function buildProjectLabelSelectKey(
	projectId: string | undefined,
	labelsLength: number,
	labelId: string,
): string {
	return `${projectId ?? 'new'}-${labelsLength}-${labelId}`;
}

export function getProjectLabelSelectPlaceholder(labelsLoading: boolean): string {
	return labelsLoading ? 'Labels laden...' : 'Selecteer een label';
}
