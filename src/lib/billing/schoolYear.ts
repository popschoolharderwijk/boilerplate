/**
 * School year helpers for lesson fee billing.
 *
 * A school year runs from **1 September** through **31 July** of the following
 * calendar year (11 billing months; August is always a break).
 */

/** Month index (0-based) in which no billing takes place. */
const NON_BILLING_MONTH_INDEX = 7; // August

/** Number of billing months per school year. */
export const BILLING_MONTHS_PER_YEAR = 11;

export interface SchoolYearWindow {
	/** YYYY-MM-DD, 1 September. */
	start: string;
	/** YYYY-MM-DD, 31 July of the following calendar year. */
	end: string;
	/** Calendar year of the September start. */
	startYear: number;
}

function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

/**
 * Determine the school year a date falls in.
 * - Dates in Jan–Jul belong to the school year that started in the previous year.
 * - Dates in Aug–Dec belong to the school year starting in that year.
 *   (August itself is technically not a lesson month, but belongs to the upcoming school year.)
 */
function getSchoolYearForDate(date: Date): SchoolYearWindow {
	const year = date.getFullYear();
	const month = date.getMonth();
	const startYear = month >= 8 || month === NON_BILLING_MONTH_INDEX ? year : year - 1;
	return {
		startYear,
		start: `${startYear}-09-01`,
		end: `${startYear + 1}-07-31`,
	};
}

/** School year a YYYY-MM-DD string falls in. */
export function getSchoolYearForDateString(dateStr: string): SchoolYearWindow {
	return getSchoolYearForDate(new Date(`${dateStr}T12:00:00`));
}

/**
 * Effective billing window within a given school year,
 * bounded by the agreement (start_date / end_date).
 *
 * @returns null if the agreement has no overlap with the school year.
 */
export function clampToSchoolYear(
	schoolYear: SchoolYearWindow,
	agreementStartDate: string,
	agreementEndDate: string | null,
): { start: string; end: string } | null {
	const start = agreementStartDate > schoolYear.start ? agreementStartDate : schoolYear.start;
	const end = agreementEndDate && agreementEndDate < schoolYear.end ? agreementEndDate : schoolYear.end;
	if (start > end) return null;
	return { start, end };
}

/** True if YYYY-MM-DD falls in August. */
export function isNonBillingMonthString(dateStr: string): boolean {
	// dateStr = "YYYY-MM-DD"; month segment is position 5-7 (1-based).
	return dateStr.slice(5, 7) === pad(NON_BILLING_MONTH_INDEX + 1);
}
