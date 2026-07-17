import type { SupabaseClient } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import type { DataTableColumn } from '@/components/ui/data-table';
import { UserDisplay } from '@/components/ui/user-display';
import { buildSlotCountByProject, mapProjectRow } from '@/lib/projects/projectsPageMappers';
import type { ProjectRow } from '@/types/projects';

export const PROJECT_COLUMNS: DataTableColumn<ProjectRow>[] = [
	{
		key: 'name',
		label: 'Naam',
		sortable: true,
		sortValue: (p) => p.name.toLowerCase(),
		render: (p) => (
			<div>
				<p className="font-medium">{p.name}</p>
				{p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
			</div>
		),
	},
	{
		key: 'domain',
		label: 'Domein',
		sortable: true,
		sortValue: (p) => p.domain_name.toLowerCase(),
		render: (p) => <span className="text-muted-foreground">{p.domain_name}</span>,
	},
	{
		key: 'label',
		label: 'Label',
		sortable: true,
		sortValue: (p) => p.label_name.toLowerCase(),
		render: (p) => <span className="text-muted-foreground">{p.label_name}</span>,
	},
	{
		key: 'slot_count',
		label: 'Aantal',
		sortable: true,
		sortValue: (p) => p.slot_count,
		render: (p) => <span className="text-muted-foreground">{p.slot_count}</span>,
	},
	{
		key: 'owner',
		label: 'Eigenaar',
		sortable: true,
		sortValue: (p) => (p.owner_first_name ?? p.owner_email ?? '').toLowerCase(),
		render: (p) => (
			<UserDisplay
				profile={{
					first_name: p.owner_first_name,
					last_name: p.owner_last_name,
					email: p.owner_email,
					avatar_url: p.owner_avatar_url,
				}}
			/>
		),
	},
	{
		key: 'cost_center',
		label: 'Kostenplaats',
		sortable: true,
		sortValue: (p) => p.cost_center ?? '',
		render: (p) => <span className="text-muted-foreground">{p.cost_center ?? '—'}</span>,
	},
	{
		key: 'status',
		label: 'Status',
		sortable: true,
		sortValue: (p) => (p.is_active ? 1 : 0),
		render: (p) => (
			<Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Actief' : 'Inactief'}</Badge>
		),
	},
];

export async function fetchProjectRows(
	client: SupabaseClient,
): Promise<{ projects: ProjectRow[]; error: string | null }> {
	const { data: projectsData, error: projectsError } = await client
		.from('projects')
		.select('*')
		.order('name', { ascending: true });

	if (projectsError) {
		return { projects: [], error: projectsError.message };
	}

	const rawProjects = projectsData ?? [];
	if (rawProjects.length === 0) {
		return { projects: [], error: null };
	}

	const projectIds = rawProjects.map((p) => p.id);
	const { data: projectEvents } = await client
		.from('agenda_events')
		.select('source_id')
		.eq('source_type', 'project')
		.in('source_id', projectIds);

	const slotCountByProject = buildSlotCountByProject(projectIds, projectEvents);

	const labelIds = [...new Set(rawProjects.map((p) => p.label_id))];
	const { data: labels } = await client.from('project_labels').select('id, name, domain_id').in('id', labelIds);
	const domainIds = [...new Set((labels ?? []).map((l) => l.domain_id))];
	const { data: domains } = await client.from('project_domains').select('id, name').in('id', domainIds);
	const ownerIds = [...new Set(rawProjects.map((p) => p.owner_user_id))];
	const { data: profiles } = await client
		.from('view_profiles_with_display_name')
		.select('user_id, first_name, last_name, email, avatar_url')
		.in('user_id', ownerIds);

	const labelMap = new Map((labels ?? []).map((l) => [l.id, l]));
	const domainMap = new Map((domains ?? []).map((d) => [d.id, d]));
	const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

	return {
		projects: rawProjects.map((p) => mapProjectRow(p, labelMap, domainMap, profileMap, slotCountByProject)),
		error: null,
	};
}

export type ProjectAction =
	| { kind: 'create' }
	| { kind: 'edit'; project: ProjectRow }
	| { kind: 'delete'; project: ProjectRow }
	| { kind: 'confirm-delete' };

export async function deleteProjectRow(project: ProjectRow): Promise<{ deleted: boolean; error: string | null }> {
	const { supabase } = await import('@/integrations/supabase/client');
	const { data, error } = await supabase.from('projects').delete().eq('id', project.id).select('id');
	if (error) {
		return { deleted: false, error: error.message };
	}
	if (!data?.length) {
		return {
			deleted: false,
			error: 'Geen rechten om dit project te verwijderen. Alleen beheerders kunnen projecten verwijderen.',
		};
	}
	return { deleted: true, error: null };
}
