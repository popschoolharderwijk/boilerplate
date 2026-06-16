/**
 * Schooljaar-helpers voor lesgeld-incasso.
 *
 * Een schooljaar loopt van **1 september** t/m **31 juli** van het volgende
 * kalenderjaar (11 incassomaanden, augustus is altijd pauze).
 */

/** Maand-index (0-based) waarin geen incasso plaatsvindt. */
const NON_BILLING_MONTH_INDEX = 7; // augustus

/** Aantal incassomaanden per schooljaar. */
export const BILLING_MONTHS_PER_YEAR = 11;

export interface SchoolYearWindow {
	/** YYYY-MM-DD, 1 september. */
	start: string;
	/** YYYY-MM-DD, 31 juli van het volgende kalenderjaar. */
	end: string;
	/** Het kalenderjaar van de september-start. */
	startYear: number;
}

function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

/**
 * Bepaal het schooljaar waarin een datum valt.
 * - Datums in jan-juli horen bij schooljaar dat startte in het voorgaande jaar.
 * - Datums in aug-dec horen bij schooljaar dat in dit jaar start.
 *   (Augustus zelf is technisch geen lesmaand, maar valt onder het komende schooljaar.)
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

/** Schooljaar waarin een YYYY-MM-DD string valt. */
export function getSchoolYearForDateString(dateStr: string): SchoolYearWindow {
	return getSchoolYearForDate(new Date(`${dateStr}T12:00:00`));
}

/**
 * Effectief venster voor incasso-berekening in een gegeven schooljaar,
 * begrensd door de overeenkomst (start_date / end_date).
 *
 * @returns null als de overeenkomst geen overlap heeft met het schooljaar.
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

/** True als YYYY-MM-DD in augustus valt. */
export function isNonBillingMonthString(dateStr: string): boolean {
	// dateStr = "YYYY-MM-DD"; maand-segment is positie 5-7 (1-based).
	return dateStr.slice(5, 7) === pad(NON_BILLING_MONTH_INDEX + 1);
}
