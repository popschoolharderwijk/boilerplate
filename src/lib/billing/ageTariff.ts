/**
 * Age-tariff selection for lesson fees.
 *
 * Tariff is determined on the **phase start date** (usually 1 September or the
 * agreement start_date). A mid-year birthday does not trigger an automatic
 * tariff switch (consistent with "no proration").
 */

export type AgeTariff = 'under_21' | 'adult';

/**
 * Pick which tariff applies for a student on a given date.
 * A student is "21+" once their 21st birthday falls on or before the reference date.
 *
 * @param dateOfBirth YYYY-MM-DD or null. When null, falls back to `adult`
 *                    (safe choice: higher tariff, avoids under-billing).
 * @param onDate      Reference date (Date or YYYY-MM-DD).
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
 * Select the matching price (in cents) for the age tariff.
 * @returns null when the selected price is missing on the option.
 */
export function pickPriceCents(option: OptionPrices, tariff: AgeTariff): number | null {
	return tariff === 'under_21' ? option.price_per_lesson_under_21_cents : option.price_per_lesson_adult_cents;
}
