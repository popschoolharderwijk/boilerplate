import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
	assembleProjectLabelOptions,
	mergeCurrentProjectLabel,
	needsCurrentProjectLabelFetch,
	type ProjectLabelOption,
} from '@/lib/projects/projectFormLabelHelpers';

export interface ProjectFormSaveInput {
	name: string;
	label_id: string;
	owner_user_id: string;
	cost_center: string;
	description: string;
	is_active: boolean;
}

interface ProjectFormSavePayload {
	name: string;
	label_id: string;
	owner_user_id: string;
	cost_center: string | null;
	description: string | null;
	is_active: boolean;
}

function validateProjectFormInput(form: ProjectFormSaveInput): boolean {
	return Boolean(form.name.trim() && form.label_id && form.owner_user_id);
}

function buildProjectFormSavePayload(form: ProjectFormSaveInput): ProjectFormSavePayload {
	return {
		name: form.name.trim(),
		label_id: form.label_id,
		owner_user_id: form.owner_user_id,
		cost_center: form.cost_center.trim() || null,
		description: form.description.trim() || null,
		is_active: form.is_active,
	};
}

function buildProjectFormStateFromProject(project: {
	id: string;
	name: string;
	label_id: string;
	owner_user_id: string;
	cost_center: string | null;
	description: string | null;
	is_active: boolean;
}): ProjectFormSaveInput & { id: string } {
	return {
		id: project.id,
		name: project.name,
		label_id: project.label_id,
		owner_user_id: project.owner_user_id,
		cost_center: project.cost_center ?? '',
		description: project.description ?? '',
		is_active: project.is_active,
	};
}

export function buildEmptyProjectFormState(): ProjectFormSaveInput {
	return {
		name: '',
		label_id: '',
		owner_user_id: '',
		cost_center: '',
		description: '',
		is_active: true,
	};
}

export async function loadProjectLabelOptions(currentLabelId?: string): Promise<ProjectLabelOption[]> {
	const { data: activeLabelsData } = await supabase
		.from('project_labels')
		.select('id, name, domain_id')
		.eq('is_active', true)
		.order('name');

	let labelsData = activeLabelsData ?? [];

	if (needsCurrentProjectLabelFetch(labelsData, currentLabelId)) {
		const { data: currentLabel } = await supabase
			.from('project_labels')
			.select('id, name, domain_id')
			.eq('id', currentLabelId as string)
			.maybeSingle();
		labelsData = mergeCurrentProjectLabel(labelsData, currentLabel ?? undefined);
	}

	const domainIds = [...new Set(labelsData.map((label) => label.domain_id))];
	if (labelsData.length === 0) return [];

	const { data: domains } = await supabase.from('project_domains').select('id, name').in('id', domainIds);
	return assembleProjectLabelOptions(labelsData, domains);
}

export function resolveProjectFormDialogInitialState(
	project: {
		id: string;
		name: string;
		label_id: string;
		owner_user_id: string;
		cost_center: string | null;
		description: string | null;
		is_active: boolean;
	} | null,
): ProjectFormSaveInput & { id?: string } {
	return project ? buildProjectFormStateFromProject(project) : buildEmptyProjectFormState();
}

export function mergeProjectFormLabelAfterLoad(
	form: ProjectFormSaveInput & { id?: string },
	projectLabelId: string | undefined,
): ProjectFormSaveInput & { id?: string } {
	if (!projectLabelId) return form;
	return { ...form, label_id: projectLabelId };
}

function getProjectFormSaveErrorMessage(isEditing: boolean): string {
	return isEditing ? 'Fout bij bijwerken project' : 'Fout bij aanmaken project';
}

export async function runProjectFormDialogSubmit(params: {
	form: ProjectFormSaveInput & { id?: string };
	isEditing: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
}): Promise<void> {
	const { form, isEditing, onOpenChange, onSaved } = params;

	if (!validateProjectFormInput(form)) {
		toast.error('Vul alle verplichte velden in');
		return;
	}

	const payload = buildProjectFormSavePayload(form);
	const result = await saveProjectForm(isEditing, form.id, payload);

	if (result.ok === false) {
		toast.error(getProjectFormSaveErrorMessage(isEditing), {
			description: result.message,
		});
		return;
	}

	onOpenChange(false);
	onSaved();
}

async function saveProjectForm(
	isEditing: boolean,
	projectId: string | undefined,
	payload: ProjectFormSavePayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
	if (isEditing && projectId) {
		const { error } = await supabase.from('projects').update(payload).eq('id', projectId);
		if (error) {
			return { ok: false, message: error.message };
		}
		toast.success('Project bijgewerkt');
		return { ok: true };
	}

	const { error } = await supabase.from('projects').insert(payload);
	if (error) {
		return { ok: false, message: error.message };
	}
	toast.success('Project aangemaakt');
	return { ok: true };
}
