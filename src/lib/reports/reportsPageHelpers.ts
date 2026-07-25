export function shouldRedirectReportsAccess(authLoading: boolean, hasAccess: boolean): boolean {
	return !authLoading && !hasAccess;
}
