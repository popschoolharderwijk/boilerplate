import { describe, expect, it, mock } from 'bun:test';
import { runProjectPageAction } from '../../../src/lib/projects/projectsPageControllerHelpers';
import type { ProjectRow } from '../../../src/types/projects';

const project: ProjectRow = {
	id: 'proj-1',
	name: 'Project A',
	description: null,
	cost_center: null,
	is_active: true,
	owner_user_id: 'owner-1',
	label_id: 'label-1',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	created_by: null,
	updated_by: null,
	label_name: 'Label',
	domain_name: 'Domain',
	owner_first_name: null,
	owner_last_name: null,
	owner_email: null,
	owner_avatar_url: null,
	slot_count: 0,
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

mock.module('../../../src/lib/projects/projectsPageHelpers', () => ({
	deleteProjectRow: async () => ({ deleted: true, error: null }),
}));

describe('runProjectPageAction', () => {
	it('opens create dialog for create action', async () => {
		const formDialog: Array<{ open: boolean; project: ProjectRow | null }> = [];
		await runProjectPageAction({ kind: 'create' }, null, {
			setFormDialog: (value) => formDialog.push(value),
			setDeleteDialog: () => {},
			setProjects: () => {},
		});
		expect(formDialog).toEqual([{ open: true, project: null }]);
	});

	it('opens edit dialog for edit action', async () => {
		const formDialog: Array<{ open: boolean; project: ProjectRow | null }> = [];
		await runProjectPageAction({ kind: 'edit', project }, null, {
			setFormDialog: (value) => formDialog.push(value),
			setDeleteDialog: () => {},
			setProjects: () => {},
		});
		expect(formDialog).toEqual([{ open: true, project }]);
	});

	it('opens delete dialog for delete action', async () => {
		const deleteDialog: Array<{ open: boolean; project: ProjectRow } | null> = [];
		await runProjectPageAction({ kind: 'delete', project }, null, {
			setFormDialog: () => {},
			setDeleteDialog: (value) => deleteDialog.push(value),
			setProjects: () => {},
		});
		expect(deleteDialog).toEqual([{ open: true, project }]);
	});

	it('deletes project and clears delete dialog on confirm delete', async () => {
		let deleteDialog: { open: boolean; project: ProjectRow } | null = { open: true, project };
		const projects: ProjectRow[] = [project];
		await runProjectPageAction({ kind: 'confirm-delete' }, deleteDialog, {
			setFormDialog: () => {},
			setDeleteDialog: (value) => {
				deleteDialog = value;
			},
			setProjects: (updater) => {
				projects.splice(0, projects.length, ...updater(projects));
			},
		});
		expect(deleteDialog).toBeNull();
		expect(projects).toEqual([]);
	});
});
