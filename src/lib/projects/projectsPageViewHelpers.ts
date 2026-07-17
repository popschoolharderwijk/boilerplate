import type { ProjectAction } from '@/lib/projects/projectsPageHelpers';
import type { ProjectRow } from '@/types/projects';

export interface ProjectsPagePermissions {
	canView: boolean;
	canEdit: boolean;
	canSchedule: boolean;
}

export function resolveProjectsPagePermissions(
	isTeacher: boolean,
	isPrivileged: boolean,
	isAdmin: boolean,
	isSiteAdmin: boolean,
): ProjectsPagePermissions {
	return {
		canView: isTeacher || isPrivileged,
		canEdit: isAdmin || isSiteAdmin,
		canSchedule: isPrivileged,
	};
}

export interface ProjectsRowActions {
	onEdit?: (project: ProjectRow) => void;
	onDelete?: (project: ProjectRow) => void;
}

export function buildProjectsRowActions(
	canEdit: boolean,
	runAction: (action: ProjectAction) => void,
): ProjectsRowActions {
	if (!canEdit) return {};
	return {
		onEdit: (project) => runAction({ kind: 'edit', project }),
		onDelete: (project) => runAction({ kind: 'delete', project }),
	};
}

export function resolveProjectAgendaCanSchedule(canSchedule: boolean, isActive: boolean): boolean {
	return canSchedule && isActive;
}

export function resolveProjectsPageRedirect(canView: boolean): boolean {
	return !canView;
}
