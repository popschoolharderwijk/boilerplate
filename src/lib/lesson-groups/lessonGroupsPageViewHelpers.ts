export function resolveLessonGroupsPageAccess(
	isAdmin: boolean,
	isSiteAdmin: boolean,
	isPrivileged: boolean,
	isTeacher: boolean,
): { canView: boolean; canEdit: boolean } {
	return {
		canView: isAdmin || isSiteAdmin || isPrivileged || isTeacher,
		canEdit: isAdmin || isSiteAdmin || isPrivileged,
	};
}

export type LessonGroupsPageView = 'redirect' | 'content';

export function resolveLessonGroupsPageView(isLoading: boolean, canView: boolean): LessonGroupsPageView {
	if (!isLoading && !canView) return 'redirect';
	return 'content';
}

export function resolveLessonGroupDeleteDialogOpen(open: boolean): boolean {
	return open;
}
