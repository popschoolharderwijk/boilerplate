import { toast } from 'sonner';
import { deleteProjectRow, type ProjectAction } from '@/lib/projects/projectsPageHelpers';
import type { ProjectRow } from '@/types/projects';

type ProjectRunActionKind = 'open-create' | 'open-edit' | 'open-delete' | 'confirm-delete';

function resolveProjectRunAction(action: ProjectAction): ProjectRunActionKind {
	if (action.kind === 'create') return 'open-create';
	if (action.kind === 'edit') return 'open-edit';
	if (action.kind === 'delete') return 'open-delete';
	return 'confirm-delete';
}

type ProjectDeleteToastKind = 'error-not-deleted' | 'error-deleted' | 'success';

function resolveProjectDeleteToast(
	result: { deleted: boolean; error: string | null },
	projectName: string,
): { kind: ProjectDeleteToastKind; message: string; description?: string } {
	if (result.error) {
		return {
			kind: result.deleted ? 'error-deleted' : 'error-not-deleted',
			message: result.deleted ? 'Fout bij verwijderen project' : 'Project niet verwijderd',
			description: result.error,
		};
	}
	return {
		kind: 'success',
		message: 'Project verwijderd',
		description: `${projectName} is verwijderd.`,
	};
}

export interface ProjectPageControllerSetters {
	setFormDialog: (value: { open: boolean; project: ProjectRow | null }) => void;
	setDeleteDialog: (value: { open: boolean; project: ProjectRow } | null) => void;
	setProjects: (updater: (prev: ProjectRow[]) => ProjectRow[]) => void;
}

function applyProjectPageOpenAction(
	resolved: ProjectRunActionKind,
	action: ProjectAction,
	setters: ProjectPageControllerSetters,
): boolean {
	if (resolved === 'open-create') {
		setters.setFormDialog({ open: true, project: null });
		return true;
	}
	if (resolved === 'open-edit' && action.kind === 'edit') {
		setters.setFormDialog({ open: true, project: action.project });
		return true;
	}
	if (resolved === 'open-delete' && action.kind === 'delete') {
		setters.setDeleteDialog({ open: true, project: action.project });
		return true;
	}
	return false;
}

async function runProjectPageConfirmDelete(
	deleteDialog: { open: boolean; project: ProjectRow },
	setters: ProjectPageControllerSetters,
): Promise<void> {
	const result = await deleteProjectRow(deleteDialog.project);
	const toastResult = resolveProjectDeleteToast(result, deleteDialog.project.name);
	if (toastResult.kind !== 'success') {
		toast.error(toastResult.message, { description: toastResult.description });
		if (toastResult.kind === 'error-not-deleted') {
			setters.setDeleteDialog(null);
			return;
		}
		throw new Error(result.error ?? toastResult.message);
	}
	toast.success(toastResult.message, { description: toastResult.description });
	const deletedProjectId = deleteDialog.project.id;
	setters.setProjects((prev) => prev.filter((project) => project.id !== deletedProjectId));
	setters.setDeleteDialog(null);
}

export async function runProjectPageAction(
	action: ProjectAction,
	deleteDialog: { open: boolean; project: ProjectRow } | null,
	setters: ProjectPageControllerSetters,
): Promise<void> {
	const resolved = resolveProjectRunAction(action);
	if (applyProjectPageOpenAction(resolved, action, setters)) return;
	if (!deleteDialog?.project) return;
	await runProjectPageConfirmDelete(deleteDialog, setters);
}
