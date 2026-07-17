import type { ProjectRow } from '@/types/projects';

export type RawProject = {
	id: string;
	name: string;
	description: string | null;
	cost_center: string | null;
	is_active: boolean;
	owner_user_id: string;
	label_id: string;
	created_at: string;
	updated_at: string;
	created_by: string | null;
	updated_by: string | null;
};

export function buildSlotCountByProject(
	projectIds: string[],
	projectEvents: Array<{ source_id: string | null }> | null,
): Map<string, number> {
	const slotCountByProject = new Map<string, number>();
	for (const id of projectIds) slotCountByProject.set(id, 0);
	for (const row of projectEvents ?? []) {
		if (row.source_id) {
			slotCountByProject.set(row.source_id, (slotCountByProject.get(row.source_id) ?? 0) + 1);
		}
	}
	return slotCountByProject;
}

export function mapProjectRow(
	p: RawProject,
	labelMap: Map<string, { name: string; domain_id: string }>,
	domainMap: Map<string, { name: string }>,
	profileMap: Map<
		string,
		{ first_name: string | null; last_name: string | null; email: string | null; avatar_url: string | null }
	>,
	slotCountByProject: Map<string, number>,
): ProjectRow {
	const label = labelMap.get(p.label_id);
	const domain = label ? domainMap.get(label.domain_id) : undefined;
	const owner = profileMap.get(p.owner_user_id);
	return {
		id: p.id,
		name: p.name,
		description: p.description,
		cost_center: p.cost_center,
		is_active: p.is_active,
		owner_user_id: p.owner_user_id,
		label_id: p.label_id,
		created_at: p.created_at,
		updated_at: p.updated_at,
		created_by: p.created_by,
		updated_by: p.updated_by,
		label_name: label?.name ?? '—',
		domain_name: domain?.name ?? '—',
		owner_first_name: owner?.first_name ?? null,
		owner_last_name: owner?.last_name ?? null,
		owner_email: owner?.email ?? null,
		owner_avatar_url: owner?.avatar_url ?? null,
		slot_count: slotCountByProject.get(p.id) ?? 0,
	};
}
