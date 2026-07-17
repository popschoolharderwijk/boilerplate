export function resolveTargetTeacherUserId(params: {
	routeId: string | undefined;
	isTeacher: boolean;
	teacherUserId: string | null | undefined;
	authLoading: boolean;
}): string | null {
	if (params.authLoading) return null;
	if (params.routeId) return params.routeId;
	if (params.isTeacher && params.teacherUserId) return params.teacherUserId;
	return null;
}

export function canAccessTeacherProfile(params: {
	targetTeacherUserId: string | null;
	isAdmin: boolean;
	isSiteAdmin: boolean;
	isTeacher: boolean;
	teacherUserId: string | null | undefined;
}): boolean {
	if (!params.targetTeacherUserId) return false;
	if (params.isAdmin || params.isSiteAdmin) return true;
	return params.isTeacher && params.teacherUserId === params.targetTeacherUserId;
}
