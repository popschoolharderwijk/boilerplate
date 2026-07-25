export interface AgendaViewAccess {
	effectiveUserId: string | undefined;
	canEdit: boolean;
	canManageAgenda: boolean;
}

export function resolveAgendaViewAccess(params: {
	viewUserId: string | undefined;
	currentUserId: string | undefined;
	canEditProp: boolean | undefined;
	isPrivileged: boolean;
	isTeacher: boolean;
	hasUser: boolean;
}): AgendaViewAccess {
	const effectiveUserId = params.viewUserId ?? params.currentUserId;
	const canEdit = params.canEditProp ?? (params.hasUser && (params.isPrivileged || params.isTeacher));
	const canManageAgenda = !params.viewUserId || params.isPrivileged;
	return { effectiveUserId, canEdit, canManageAgenda };
}
