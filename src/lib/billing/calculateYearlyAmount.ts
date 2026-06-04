/**
 * Bereken het jaarbedrag en maandbedrag voor een lesovereenkomst,
 * op basis van het aantal lessen in een (school)jaar-venster, rekening
 * houdend met lesvrije periodes en de augustus-pauze.
 *
 * Pure functie, geen IO. Hergebruikt bestaande `getOccurrenceDatesInRange`.
 */

import { getOccurrenceDatesInRange } from '@/lib/lessonHelpers';
import type { LessonFrequency } from '@/types/lesson-agreements';
import { BILLING_MONTHS_PER_YEAR, isNonBillingMonthString } from './schoolYear';

export interface NoLessonPeriod {
	/** YYYY-MM-DD (inclusief). */
	start_date: string;
	/** YYYY-MM-DD (inclusief). */
	end_date: string;
}

export interface CalculateYearlyAmountInput {
	/** YYYY-MM-DD: begin van het venster (b.v. 1 september of agreement start_date). */
	periodStart: string;
	/** YYYY-MM-DD: eind van het venster (b.v. 31 juli of agreement end_date). */
	periodEnd: string;
	/** 0 = zondag … 6 = zaterdag (komt overeen met JS getDay()). */
	dayOfWeek: number;
	frequency: LessonFrequency;
	/** Prijs per les in centen. */
	pricePerLessonCents: number;
	/** Lesvrije periodes (b.v. schoolvakanties). */
	noLessonPeriods?: ReadonlyArray<NoLessonPeriod>;
	/** Aantal incassomaanden waarover het jaarbedrag verdeeld wordt. Default 11. */
	billingMonths?: number;
}

export interface CalculateYearlyAmountResult {
	/** Aantal lessen dat in het venster valt (na aftrek lesvrij + augustus). */
	lessonsCount: number;
	/** Jaarbedrag in centen (= lessonsCount × pricePerLessonCents). */
	yearlyCents: number;
	/** Standaard-maandbedrag in centen (= floor(yearlyCents / billingMonths)). */
	monthlyCents: number;
	/** Restbedrag in centen (komt op de laatste incassomaand). */
	leftoverCents: number;
	/** De daadwerkelijke lesdatums (YYYY-MM-DD), na filteren. */
	lessonDates: string[];
}

function findNoLessonPeriod(dateStr: string, periods: ReadonlyArray<NoLessonPeriod>): NoLessonPeriod | undefined {
	for (const p of periods) {
		if (dateStr >= p.start_date && dateStr <= p.end_date) return p;
	}
	return undefined;
}

function periodLengthDays(p: NoLessonPeriod): number {
	const start = Date.parse(`${p.start_date}T12:00:00`);
	const end = Date.parse(`${p.end_date}T12:00:00`);
	return Math.round((end - start) / 86_400_000) + 1;
}

function shiftDateStr(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T12:00:00`);
	d.setDate(d.getDate() + days);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function calculateYearlyAmount(input: CalculateYearlyAmountInput): CalculateYearlyAmountResult {
	const { periodStart, periodEnd, dayOfWeek, frequency, pricePerLessonCents } = input;
	const billingMonths = input.billingMonths ?? BILLING_MONTHS_PER_YEAR;
	const noLessonPeriods = input.noLessonPeriods ?? [];

	if (periodStart > periodEnd || pricePerLessonCents <= 0) {
		return { lessonsCount: 0, yearlyCents: 0, monthlyCents: 0, leftoverCents: 0, lessonDates: [] };
	}

	// Genereer alle theoretische lesdatums in het venster.
	const start = new Date(`${periodStart}T12:00:00`);
	const end = new Date(`${periodEnd}T12:00:00`);
	const allDates = getOccurrenceDatesInRange(dayOfWeek, start, end, frequency);

	// Pas verschuif-logica toe: een lesvrije periode duwt alle volgende lessen door
	// met exact de lengte van de periode. Lessen die voorbij `periodEnd` schuiven
	// vervallen. Augustus blijft puur skip (geen shift, geen les).
	const lessonDates: string[] = [];
	let shiftDays = 0;
	for (const original of allDates) {
		let actual = shiftDays > 0 ? shiftDateStr(original, shiftDays) : original;
		while (true) {
			const period = findNoLessonPeriod(actual, noLessonPeriods);
			if (!period) break;
			const len = periodLengthDays(period);
			shiftDays += len;
			actual = shiftDateStr(actual, len);
		}
		if (actual > periodEnd) continue; // valt voorbij harde einddatum
		if (isNonBillingMonthString(actual)) continue; // augustus blijft skip
		lessonDates.push(actual);
	}

	const lessonsCount = lessonDates.length;
	const yearlyCents = lessonsCount * pricePerLessonCents;
	const monthlyCents = billingMonths > 0 ? Math.floor(yearlyCents / billingMonths) : 0;
	const leftoverCents = yearlyCents - monthlyCents * billingMonths;

	return { lessonsCount, yearlyCents, monthlyCents, leftoverCents, lessonDates };
}
