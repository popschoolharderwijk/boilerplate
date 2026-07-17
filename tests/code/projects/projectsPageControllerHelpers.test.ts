import { describe, expect, it } from 'bun:test';
import {
	applyProjectPageOpenAction,
	resolveProjectDeleteToast,
	resolveProjectRunAction,
} from '../../../src/lib/projects/projectsPageControllerHelpers';
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

describe('resolveProjectRunAction', () => {
	it('maps project actions to controller steps', () => {
		expect(resolveProjectRunAction({ kind: 'create' })).toBe('open-create');
		expect(resolveProjectRunAction({ kind: 'edit', project })).toBe('open-edit');
		expect(resolveProjectRunAction({ kind: 'delete', project })).toBe('open-delete');
		expect(resolveProjectRunAction({ kind: 'confirm-delete' })).toBe('confirm-delete');
	});
});

describe('resolveProjectDeleteToast', () => {
	it('returns success toast details', () => {
		expect(resolveProjectDeleteToast({ deleted: true, error: null }, 'Project A')).toEqual({
			kind: 'success',
			message: 'Project verwijderd',
			description: 'Project A is verwijderd.',
		});
	});

	it('returns not-deleted error toast details', () => {
		expect(resolveProjectDeleteToast({ deleted: false, error: 'no rights' }, 'Project A')).toEqual({
			kind: 'error-not-deleted',
			message: 'Project niet verwijderd',
			description: 'no rights',
		});
	});

	it('returns deleted error toast details', () => {
		expect(resolveProjectDeleteToast({ deleted: true, error: 'partial failure' }, 'Project A')).toEqual({
			kind: 'error-deleted',
			message: 'Fout bij verwijderen project',
			description: 'partial failure',
		});
	});
});

describe('applyProjectPageOpenAction', () => {
	it('opens create dialog for create action', () => {
		const formDialog: Array<{ open: boolean; project: ProjectRow | null }> = [];
		const handled = applyProjectPageOpenAction(
			'open-create',
			{ kind: 'create' },
			{
				setFormDialog: (value) => formDialog.push(value),
				setDeleteDialog: () => {},
				setProjects: () => {},
			},
		);
		expect(handled).toBe(true);
		expect(formDialog).toEqual([{ open: true, project: null }]);
	});

	it('opens edit dialog for edit action', () => {
		const formDialog: Array<{ open: boolean; project: ProjectRow | null }> = [];
		const handled = applyProjectPageOpenAction(
			'open-edit',
			{ kind: 'edit', project },
			{
				setFormDialog: (value) => formDialog.push(value),
				setDeleteDialog: () => {},
				setProjects: () => {},
			},
		);
		expect(handled).toBe(true);
		expect(formDialog).toEqual([{ open: true, project }]);
	});

	it('opens delete dialog for delete action', () => {
		const deleteDialog: Array<{ open: boolean; project: ProjectRow } | null> = [];
		const handled = applyProjectPageOpenAction(
			'open-delete',
			{ kind: 'delete', project },
			{
				setFormDialog: () => {},
				setDeleteDialog: (value) => deleteDialog.push(value),
				setProjects: () => {},
			},
		);
		expect(handled).toBe(true);
		expect(deleteDialog).toEqual([{ open: true, project }]);
	});

	it('returns false for confirm-delete action', () => {
		const handled = applyProjectPageOpenAction(
			'confirm-delete',
			{ kind: 'confirm-delete' },
			{
				setFormDialog: () => {},
				setDeleteDialog: () => {},
				setProjects: () => {},
			},
		);
		expect(handled).toBe(false);
	});
});
