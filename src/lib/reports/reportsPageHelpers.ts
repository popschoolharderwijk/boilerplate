export function shouldRedirectReportsAccess(authLoading: boolean, hasAccess: boolean): boolean {
	return !authLoading && !hasAccess;
}

export function shouldShowReportsAuthSkeleton(authLoading: boolean): boolean {
	return authLoading;
}
