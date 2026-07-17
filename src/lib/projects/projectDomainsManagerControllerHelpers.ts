import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
	type ProjectDomainDeleteOutcome,
	type ProjectDomainSaveMode,
	resolveProjectDomainDeleteNotDeletedDescription,
	resolveProjectDomainDeleteOutcome,
	resolveProjectDomainSaveErrorToast,
	resolveProjectDomainSaveOperation,
	resolveProjectDomainSaveSuccessToast,
	shouldBlockProjectDomainSave,
} from '@/lib/projects/projectDomainsManagerHelpers';
import type { ProjectDomain } from '@/types/projects';

export type ProjectDomainFetchOutcome = { kind: 'success'; domains: ProjectDomain[] } | { kind: 'error' };

export async function executeProjectDomainFetch(supabase: SupabaseClient): Promise<ProjectDomainFetchOutcome> {
	const { data, error } = await supabase.from('project_domains').select('*').order('name');
	if (error) {
		toast.error('Fout bij laden domeinen');
		return { kind: 'error' };
	}
	return { kind: 'success', domains: data ?? [] };
}

type ProjectDomainSaveOutcome = 'blocked' | 'success' | 'error';

interface ExecuteProjectDomainSaveParams {
	name: string;
	editing: ProjectDomain | null;
	supabase: SupabaseClient;
}

async function executeProjectDomainSave(params: ExecuteProjectDomainSaveParams): Promise<ProjectDomainSaveOutcome> {
	if (shouldBlockProjectDomainSave(params.name)) {
		return 'blocked';
	}

	const mode: ProjectDomainSaveMode = resolveProjectDomainSaveOperation(params.editing);
	const payload = { name: params.name.trim() };
	const { error } = params.editing
		? await params.supabase.from('project_domains').update(payload).eq('id', params.editing.id)
		: await params.supabase.from('project_domains').insert(payload);

	if (error) {
		toast.error(resolveProjectDomainSaveErrorToast(mode));
		return 'error';
	}

	toast.success(resolveProjectDomainSaveSuccessToast(mode));
	return 'success';
}

function showProjectDomainNotDeletedToast(outcome: ProjectDomainDeleteOutcome): void {
	toast.error('Domein niet verwijderd', {
		description: resolveProjectDomainDeleteNotDeletedDescription(outcome),
	});
}

interface ExecuteProjectDomainDeleteParams {
	deleteTarget: ProjectDomain;
	supabase: SupabaseClient;
}

async function executeProjectDomainDelete(
	params: ExecuteProjectDomainDeleteParams,
): Promise<ProjectDomainDeleteOutcome> {
	const { data, error } = await params.supabase
		.from('project_domains')
		.delete()
		.eq('id', params.deleteTarget.id)
		.select('id');
	const outcome = resolveProjectDomainDeleteOutcome(error, data);

	if (outcome === 'success') {
		toast.success('Domein verwijderd');
		return outcome;
	}

	showProjectDomainNotDeletedToast(outcome);
	return outcome;
}

export interface RunProjectDomainSaveFlowParams {
	name: string;
	editing: ProjectDomain | null;
	supabase: SupabaseClient;
	setSaving: (saving: boolean) => void;
	setDialogOpen: (open: boolean) => void;
	fetchDomains: () => Promise<void>;
	onDomainsChange?: () => void;
}

export async function runProjectDomainSaveFlow(params: RunProjectDomainSaveFlowParams): Promise<void> {
	params.setSaving(true);
	const outcome = await executeProjectDomainSave({
		name: params.name,
		editing: params.editing,
		supabase: params.supabase,
	});
	params.setSaving(false);
	if (outcome !== 'success') return;

	params.setDialogOpen(false);
	await params.fetchDomains();
	params.onDomainsChange?.();
}

export interface RunProjectDomainDeleteFlowParams {
	deleteTarget: ProjectDomain | null;
	supabase: SupabaseClient;
	setDeleteTarget: (target: ProjectDomain | null) => void;
	fetchDomains: () => Promise<void>;
	onDomainsChange?: () => void;
}

export async function runProjectDomainDeleteFlow(params: RunProjectDomainDeleteFlowParams): Promise<void> {
	if (!params.deleteTarget) return;

	await executeProjectDomainDelete({ deleteTarget: params.deleteTarget, supabase: params.supabase });
	params.setDeleteTarget(null);
	await params.fetchDomains();
	params.onDomainsChange?.();
}
