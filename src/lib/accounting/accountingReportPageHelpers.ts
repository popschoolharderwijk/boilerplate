export type AccountingReportPageView = 'redirect' | 'loading' | 'content';

export function resolveAccountingReportPageView(
	authLoading: boolean,
	hasAccess: boolean,
	settingsLoading: boolean,
): AccountingReportPageView {
	if (!authLoading && !hasAccess) return 'redirect';
	if (authLoading || settingsLoading) return 'loading';
	return 'content';
}
