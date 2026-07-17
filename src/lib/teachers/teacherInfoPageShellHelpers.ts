export type TeacherInfoPageGate = 'loading' | 'denied' | 'profile-loading' | 'ready';

export function shouldRedirectTeacherInfo(pageGate: TeacherInfoPageGate): boolean {
	return pageGate === 'denied';
}

export function shouldShowTeacherInfoSkeleton(
	pageGate: TeacherInfoPageGate,
	teacherProfile: unknown,
	targetTeacherUserId: string | null,
): boolean {
	if (pageGate === 'loading' || pageGate === 'profile-loading') {
		return true;
	}
	return teacherProfile === null || targetTeacherUserId === null;
}

export function resolveTeacherInfoPageGate(params: {
	authLoading: boolean;
	targetTeacherUserId: string | null;
	canAccess: boolean;
	loading: boolean;
	hasProfile: boolean;
}): TeacherInfoPageGate {
	if (params.authLoading || !params.targetTeacherUserId) return 'loading';
	if (!params.canAccess) return 'denied';
	if (params.loading || !params.hasProfile) return 'profile-loading';
	return 'ready';
}
