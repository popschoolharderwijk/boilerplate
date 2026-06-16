/**
 * Calculate the yearly and monthly amounts for a lesson agreement,
 * based on the number of lessons in a (school) year window, accounting
 * for no-lesson periods and the August break.
 *
 * Pure function, no IO. Reuses existing `getOccurrenceDatesInRange`.
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
	/** YYYY-MM-DD: start of the window (e.g. 1 September or agreement start_date). */
	periodStart: string;
	/** YYYY-MM-DD: end of the window (e.g. 31 July or agreement end_date). */
	periodEnd: string;
	/** 0 = Sunday … 6 = Saturday (matches JS getDay()). */
	dayOfWeek: number;
	frequency: LessonFrequency;
	/** Price per lesson in cents. */
	pricePerLessonCents: number;
	/** No-lesson periods (e.g. school holidays). */
	noLessonPeriods?: ReadonlyArray<NoLessonPeriod>;
	/** Number of billing months over which the yearly amount is spread. Default 11. */
	billingMonths?: number;
}

export interface CalculateYearlyAmountResult {
	/** Number of lessons within the window (after excluding no-lesson periods + August). */
	lessonsCount: number;
	/** Yearly amount in cents (= lessonsCount × pricePerLessonCents). */
	yearlyCents: number;
	/** Standard monthly amount in cents (= floor(yearlyCents / billingMonths)). */
	monthlyCents: number;
	/** Remainder in cents (applied to the last billing month). */
	leftoverCents: number;
	/** Actual lesson dates (YYYY-MM-DD), after filtering. */
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

	// Generate all theoretical lesson dates in the window.
	const start = new Date(`${periodStart}T12:00:00`);
	const end = new Date(`${periodEnd}T12:00:00`);
	const allDates = getOccurrenceDatesInRange(dayOfWeek, start, end, frequency);

	// Apply shift logic: a no-lesson period pushes all subsequent lessons forward
	// by exactly the length of the period. Lessons that shift past `periodEnd`
	// are dropped. August remains a pure skip (no shift, no lesson).
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
		if (actual > periodEnd) continue; // falls past hard end date
		if (isNonBillingMonthString(actual)) continue; // August remains skipped
		lessonDates.push(actual);
	}

	const lessonsCount = lessonDates.length;
	const yearlyCents = lessonsCount * pricePerLessonCents;
	const monthlyCents = billingMonths > 0 ? Math.floor(yearlyCents / billingMonths) : 0;
	const leftoverCents = yearlyCents - monthlyCents * billingMonths;

	return { lessonsCount, yearlyCents, monthlyCents, leftoverCents, lessonDates };
}
