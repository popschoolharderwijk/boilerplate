export function shouldLoadAccountingReport(enabled: boolean, startDate: string, endDate: string): boolean {
	return enabled && startDate.length > 0 && endDate.length > 0;
}
