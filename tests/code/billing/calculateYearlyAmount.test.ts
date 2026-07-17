/**
 * Unit tests for billing helpers (step 3 of Stripe lesson fee billing).
 */
import { describe, expect, it } from 'bun:test';
import { pickAgeTariff, pickPriceCents } from '../../../src/lib/billing/ageTariff';
import { calculateYearlyAmount } from '../../../src/lib/billing/calculateYearlyAmount';
import {
	clampToSchoolYear,
	getSchoolYearForDateString,
	isNonBillingMonthString,
} from '../../../src/lib/billing/schoolYear';

describe('schoolYear', () => {
	it('places September in the new school year', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		expect(sy.startYear).toBe(2026);
		expect(sy.start).toBe('2026-09-01');
		expect(sy.end).toBe('2027-07-31');
	});

	it('places January in the current school year', () => {
		const sy = getSchoolYearForDateString('2027-01-10');
		expect(sy.startYear).toBe(2026);
	});

	it('places August in the upcoming school year', () => {
		const sy = getSchoolYearForDateString('2026-08-20');
		expect(sy.startYear).toBe(2026);
	});

	it('isNonBillingMonthString detects August', () => {
		expect(isNonBillingMonthString('2026-08-01')).toBe(true);
		expect(isNonBillingMonthString('2026-07-31')).toBe(false);
		expect(isNonBillingMonthString('2026-09-01')).toBe(false);
	});

	it('clampToSchoolYear clamps to the agreement window', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		const clamped = clampToSchoolYear(sy, '2026-10-15', '2027-04-30');
		expect(clamped).toEqual({ start: '2026-10-15', end: '2027-04-30' });
	});

	it('clampToSchoolYear uses school-year bounds when the agreement is wider', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		const clamped = clampToSchoolYear(sy, '2020-01-01', null);
		expect(clamped).toEqual({ start: '2026-09-01', end: '2027-07-31' });
	});

	it('clampToSchoolYear returns null when there is no overlap', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		expect(clampToSchoolYear(sy, '2030-01-01', '2030-12-31')).toBeNull();
	});
});

describe('pickAgeTariff', () => {
	it('returns under_21 the day before the 21st birthday', () => {
		expect(pickAgeTariff('2005-09-02', '2026-09-01')).toBe('under_21');
	});
	it('returns adult on the exact 21st birthday', () => {
		expect(pickAgeTariff('2005-09-01', '2026-09-01')).toBe('adult');
	});
	it('returns adult when DOB is null (safe fallback)', () => {
		expect(pickAgeTariff(null, '2026-09-01')).toBe('adult');
	});
	it('pickPriceCents selects the matching tariff price', () => {
		const opt = { price_per_lesson_under_21_cents: 1950, price_per_lesson_adult_cents: 2360 };
		expect(pickPriceCents(opt, 'under_21')).toBe(1950);
		expect(pickPriceCents(opt, 'adult')).toBe(2360);
	});
});

describe('calculateYearlyAmount', () => {
	it('counts weekly lessons in a full school year excluding August', () => {
		// Mondays between 1 Sept 2026 and 31 Jul 2027; August does not count.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-01',
			periodEnd: '2027-07-31',
			dayOfWeek: 1, // Monday
			frequency: 'weekly',
			pricePerLessonCents: 1950,
		});
		// Sanity: roughly 47-48 Mondays in a school year without holiday deductions.
		expect(result.lessonsCount).toBeGreaterThan(40);
		expect(result.lessonsCount).toBeLessThan(50);
		expect(result.yearlyCents).toBe(result.lessonsCount * 1950);
		expect(result.monthlyCents * 11 + result.leftoverCents).toBe(result.yearlyCents);
	});

	it('subtracts no-lesson periods (holidays)', () => {
		const noPeriods = [{ start_date: '2026-12-21', end_date: '2027-01-04' }];
		const without = calculateYearlyAmount({
			periodStart: '2026-09-01',
			periodEnd: '2027-07-31',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1950,
		});
		const withVac = calculateYearlyAmount({
			periodStart: '2026-09-01',
			periodEnd: '2027-07-31',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1950,
			noLessonPeriods: noPeriods,
		});
		expect(withVac.lessonsCount).toBeLessThan(without.lessonsCount);
	});

	it('counts biweekly lessons as roughly half of weekly', () => {
		const weekly = calculateYearlyAmount({
			periodStart: '2026-09-01',
			periodEnd: '2027-07-31',
			dayOfWeek: 3,
			frequency: 'weekly',
			pricePerLessonCents: 2000,
		});
		const biweekly = calculateYearlyAmount({
			periodStart: '2026-09-01',
			periodEnd: '2027-07-31',
			dayOfWeek: 3,
			frequency: 'biweekly',
			pricePerLessonCents: 2000,
		});
		expect(biweekly.lessonsCount).toBeGreaterThan(weekly.lessonsCount / 2 - 2);
		expect(biweekly.lessonsCount).toBeLessThan(weekly.lessonsCount / 2 + 2);
	});

	it('returns 0 for zero price or an inverted window', () => {
		expect(
			calculateYearlyAmount({
				periodStart: '2026-09-01',
				periodEnd: '2027-07-31',
				dayOfWeek: 1,
				frequency: 'weekly',
				pricePerLessonCents: 0,
			}).yearlyCents,
		).toBe(0);
		expect(
			calculateYearlyAmount({
				periodStart: '2027-09-01',
				periodEnd: '2026-07-31',
				dayOfWeek: 1,
				frequency: 'weekly',
				pricePerLessonCents: 1950,
			}).lessonsCount,
		).toBe(0);
	});

	it('always excludes August lessons', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-08-01',
			periodEnd: '2026-08-31',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1950,
		});
		expect(result.lessonsCount).toBe(0);
	});
});
