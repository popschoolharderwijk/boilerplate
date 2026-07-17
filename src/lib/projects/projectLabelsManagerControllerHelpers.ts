import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
	hasLinkedProjectsForLabel,
	type ProjectLabelDeleteOutcome,
	type ProjectLabelSaveMode,
	resolveProjectLabelDeleteOutcome,
	resolveProjectLabelSaveErrorToast,
	resolveProjectLabelSaveOperation,
	resolveProjectLabelSaveSuccessToast,
	shouldBlockProjectLabelSave,
} from '@/lib/projects/projectLabelsManagerHelpers';
import type { ProjectDomain, ProjectLabel } from '@/types/projects';

export type LabelWithDomain = ProjectLabel & { project_domains: { name: string } | null };

export type ProjectLabelFetchOutcome =
	| { kind: 'success'; labels: LabelWithDomain[]; domains: ProjectDomain[] }
	| { kind: 'error' };

export async function executeProjectLabelFetch(supabase: SupabaseClient): Promise<ProjectLabelFetchOutcome> {
	const [labelsRes, domainsRes] = await Promise.all([
		supabase.from('project_labels').select('*, project_domains(name)').order('name'),
		supabase.from('project_domains').select('*').eq('is_active', true).order('name'),
	]);

	if (labelsRes.error) {
		toast.error('Fout bij laden labels');
		return { kind: 'error' };
	}

	return {
		kind: 'success',
		labels: labelsRes.data ?? [],
		domains: domainsRes.data ?? [],
	};
}

export type ProjectLabelSaveOutcome = 'blocked' | 'success' | 'error';

export interface ExecuteProjectLabelSaveParams {
	name: string;
	domainId: string;
	editing: LabelWithDomain | null;
	supabase: SupabaseClient;
}

export async function executeProjectLabelSave(params: ExecuteProjectLabelSaveParams): Promise<ProjectLabelSaveOutcome> {
	if (shouldBlockProjectLabelSave(params.name, params.domainId)) {
		return 'blocked';
	}

	const mode: ProjectLabelSaveMode = resolveProjectLabelSaveOperation(params.editing);
	const payload = { name: params.name.trim(), domain_id: params.domainId };
	const { error } = params.editing
		? await params.supabase.from('project_labels').update(payload).eq('id', params.editing.id)
		: await params.supabase.from('project_labels').insert(payload);

	if (error) {
		toast.error(resolveProjectLabelSaveErrorToast(mode));
		return 'error';
	}

	toast.success(resolveProjectLabelSaveSuccessToast(mode));
	return 'success';
}

function showProjectLabelNotDeletedToast(outcome: ProjectLabelDeleteOutcome): void {
	if (outcome === 'blocked-linked' || outcome === 'error-linked') {
		toast.error('Label niet verwijderd', {
			description: 'Er zijn nog projecten aan dit label gekoppeld.',
		});
		return;
	}
	toast.error('Label niet verwijderd', {
		description: 'Geen rechten om dit label te verwijderen.',
	});
}

function showProjectLabelDeleteErrorToast(outcome: ProjectLabelDeleteOutcome): void {
	if (outcome === 'error-linked') {
		toast.error('Fout bij verwijderen label', {
			description: 'Er zijn nog projecten aan dit label gekoppeld.',
		});
		return;
	}
	toast.error('Fout bij verwijderen label', {
		description: 'Geen rechten om dit label te verwijderen.',
	});
}

export interface ExecuteProjectLabelDeleteParams {
	deleteTarget: LabelWithDomain;
	supabase: SupabaseClient;
}

export async function executeProjectLabelDelete(
	params: ExecuteProjectLabelDeleteParams,
): Promise<ProjectLabelDeleteOutcome> {
	const { data: linkedProjects } = await params.supabase
		.from('projects')
		.select('id')
		.eq('label_id', params.deleteTarget.id)
		.limit(1);

	if (hasLinkedProjectsForLabel(linkedProjects)) {
		showProjectLabelNotDeletedToast('blocked-linked');
		return 'blocked-linked';
	}

	const { data, error } = await params.supabase
		.from('project_labels')
		.delete()
		.eq('id', params.deleteTarget.id)
		.select('id');
	const outcome = resolveProjectLabelDeleteOutcome(error, data);

	if (outcome === 'success') {
		toast.success('Label verwijderd');
		return outcome;
	}

	if (error) {
		showProjectLabelDeleteErrorToast(outcome);
		return outcome;
	}

	showProjectLabelNotDeletedToast(outcome);
	return outcome;
}

export interface RunProjectLabelSaveFlowParams {
	name: string;
	domainId: string;
	editing: LabelWithDomain | null;
	supabase: SupabaseClient;
	setSaving: (saving: boolean) => void;
	setDialogOpen: (open: boolean) => void;
	fetchData: () => Promise<void>;
}

export async function runProjectLabelSaveFlow(params: RunProjectLabelSaveFlowParams): Promise<void> {
	params.setSaving(true);
	const outcome = await executeProjectLabelSave({
		name: params.name,
		domainId: params.domainId,
		editing: params.editing,
		supabase: params.supabase,
	});
	params.setSaving(false);
	if (outcome !== 'success') return;

	params.setDialogOpen(false);
	await params.fetchData();
}

export interface RunProjectLabelDeleteFlowParams {
	deleteTarget: LabelWithDomain | null;
	supabase: SupabaseClient;
	setDeleteTarget: (target: LabelWithDomain | null) => void;
	fetchData: () => Promise<void>;
}

export async function runProjectLabelDeleteFlow(params: RunProjectLabelDeleteFlowParams): Promise<void> {
	if (!params.deleteTarget) return;

	await executeProjectLabelDelete({ deleteTarget: params.deleteTarget, supabase: params.supabase });
	params.setDeleteTarget(null);
	await params.fetchData();
}
