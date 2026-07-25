export function shouldShowNoLessonPeriodsEmpty(loading: boolean, periodCount: number): boolean {
	return !loading && periodCount === 0;
}

export function shouldShowNoLessonPeriodsList(loading: boolean, periodCount: number): boolean {
	return !loading && periodCount > 0;
}
