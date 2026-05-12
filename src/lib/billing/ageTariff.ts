/**
 * Leeftijdstarief-keuze voor lesgeld.
 *
 * Tarief wordt bepaald op de **fase-startdatum** (meestal 1 september of de
 * agreement start_date). Mid-year leeftijdsverandering leidt niet tot een
 * automatische tariefswitch (consistent met "geen proration").
 */

export type AgeTariff = 'under_21' | 'adult';

/**
 * Bepaal welk tarief geldt voor een leerling op een bepaalde datum.
 * Een leerling is "21+" zodra de 21e verjaardag op of vóór de referentiedatum ligt.
 *
 * @param dateOfBirth YYYY-MM-DD of null. Bij null vallen we terug op `adult`
 *                    (veiligste keuze: hoger tarief, voorkomt onderfacturatie).
 * @param onDate      Referentiedatum (Date of YYYY-MM-DD).
 */
export function pickAgeTariff(dateOfBirth: string | null | undefined, onDate: Date | string): AgeTariff {
	if (!dateOfBirth) return 'adult';
	const ref = typeof onDate === 'string' ? new Date(`${onDate}T12:00:00`) : onDate;
	const dob = new Date(`${dateOfBirth}T12:00:00`);
	const twentyFirst = new Date(dob);
	twentyFirst.setFullYear(twentyFirst.getFullYear() + 21);
	return ref >= twentyFirst ? 'adult' : 'under_21';
}

interface OptionPrices {
	price_per_lesson_under_21_cents: number | null;
	price_per_lesson_adult_cents: number | null;
}

/**
 * Selecteer de juiste prijs (in centen) op basis van leeftijdstarief.
 * @returns null als de geselecteerde prijs ontbreekt op de optie.
 */
export function pickPriceCents(option: OptionPrices, tariff: AgeTariff): number | null {
	return tariff === 'under_21' ? option.price_per_lesson_under_21_cents : option.price_per_lesson_adult_cents;
}
