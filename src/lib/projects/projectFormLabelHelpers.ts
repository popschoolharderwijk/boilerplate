export interface ProjectLabelRow {
	id: string;
	name: string;
	domain_id: string;
}

export interface ProjectLabelOption {
	id: string;
	name: string;
	domain_name: string;
}

export function mergeCurrentProjectLabel(
	activeLabels: ProjectLabelRow[],
	currentLabel: ProjectLabelRow | null | undefined,
): ProjectLabelRow[] {
	if (!currentLabel) return activeLabels;
	const hasCurrentLabel = activeLabels.some((label) => label.id === currentLabel.id);
	if (hasCurrentLabel) return activeLabels;
	return [currentLabel, ...activeLabels];
}

export function collectProjectDomainIds(labels: ProjectLabelRow[]): string[] {
	return [...new Set(labels.map((label) => label.domain_id))];
}

export function mapProjectLabelOptions(
	labels: ProjectLabelRow[],
	domainMap: Map<string, string>,
): ProjectLabelOption[] {
	return labels.map((label) => ({
		id: label.id,
		name: label.name,
		domain_name: domainMap.get(label.domain_id) ?? '—',
	}));
}

export function needsCurrentProjectLabelFetch(
	activeLabels: ProjectLabelRow[],
	currentLabelId: string | undefined,
): boolean {
	return Boolean(currentLabelId && !activeLabels.some((label) => label.id === currentLabelId));
}

export function buildProjectDomainNameMap(
	domains: Array<{ id: string; name: string }> | null | undefined,
): Map<string, string> {
	return new Map((domains ?? []).map((domain) => [domain.id, domain.name]));
}

export function assembleProjectLabelOptions(
	labelsData: ProjectLabelRow[],
	domains: Array<{ id: string; name: string }> | null | undefined,
): ProjectLabelOption[] {
	if (labelsData.length === 0) return [];
	return mapProjectLabelOptions(labelsData, buildProjectDomainNameMap(domains));
}
