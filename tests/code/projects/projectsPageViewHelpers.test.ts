import { describe, expect, it } from 'bun:test';
import {
	buildProjectsRowActions,
	resolveProjectAgendaCanSchedule,
	resolveProjectsPagePermissions,
	resolveProjectsPageRedirect,
} from '../../../src/lib/projects/projectsPageViewHelpers';

describe('resolveProjectsPagePermissions', () => {
	it('grants view to teachers and privileged users', () => {
		expect(resolveProjectsPagePermissions(true, false, false, false)).toEqual({
			canView: true,
			canEdit: false,
			canSchedule: false,
		});
		expect(resolveProjectsPagePermissions(false, true, false, false)).toEqual({
			canView: true,
			canEdit: false,
			canSchedule: true,
		});
	});

	it('grants edit to admins and site admins', () => {
		expect(resolveProjectsPagePermissions(false, false, true, false)).toEqual({
			canView: false,
			canEdit: true,
			canSchedule: false,
		});
	});
});

describe('buildProjectsRowActions', () => {
	it('returns edit and delete handlers when editing is allowed', () => {
		const kinds: string[] = [];
		const actions = buildProjectsRowActions(true, (action) => {
			kinds.push(action.kind);
		});
		actions.onEdit?.({ id: 'proj-1' } as never);
		actions.onDelete?.({ id: 'proj-1' } as never);
		expect(kinds).toEqual(['edit', 'delete']);
	});

	it('returns no handlers when editing is not allowed', () => {
		const actions = buildProjectsRowActions(false, () => {});
		expect(actions.onEdit).toBeUndefined();
		expect(actions.onDelete).toBeUndefined();
	});
});

describe('resolveProjectAgendaCanSchedule', () => {
	it('requires schedule permission and active project', () => {
		expect(resolveProjectAgendaCanSchedule(true, true)).toBe(true);
		expect(resolveProjectAgendaCanSchedule(true, false)).toBe(false);
		expect(resolveProjectAgendaCanSchedule(false, true)).toBe(false);
	});
});

describe('resolveProjectsPageRedirect', () => {
	it('returns true when user cannot view projects', () => {
		expect(resolveProjectsPageRedirect(false)).toBe(true);
	});

	it('returns false when user can view projects', () => {
		expect(resolveProjectsPageRedirect(true)).toBe(false);
	});
});
