/**
 * Unit tests voor billing-helpers (Stap 3 van Stripe lesgeld-incasso).
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
	it('plaatst september in nieuw schooljaar', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		expect(sy.startYear).toBe(2026);
		expect(sy.start).toBe('2026-09-01');
		expect(sy.end).toBe('2027-07-31');
	});

	it('plaatst januari in lopend schooljaar', () => {
		const sy = getSchoolYearForDateString('2027-01-10');
		expect(sy.startYear).toBe(2026);
	});

	it('plaatst augustus in komend schooljaar', () => {
		const sy = getSchoolYearForDateString('2026-08-20');
		expect(sy.startYear).toBe(2026);
	});

	it('isNonBillingMonthString detecteert augustus', () => {
		expect(isNonBillingMonthString('2026-08-01')).toBe(true);
		expect(isNonBillingMonthString('2026-07-31')).toBe(false);
		expect(isNonBillingMonthString('2026-09-01')).toBe(false);
	});

	it('clampToSchoolYear begrenst op agreement', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		const clamped = clampToSchoolYear(sy, '2026-10-15', '2027-04-30');
		expect(clamped).toEqual({ start: '2026-10-15', end: '2027-04-30' });
	});

	it('clampToSchoolYear gebruikt schooljaar-grenzen als agreement breder is', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		const clamped = clampToSchoolYear(sy, '2020-01-01', null);
		expect(clamped).toEqual({ start: '2026-09-01', end: '2027-07-31' });
	});

	it('clampToSchoolYear geeft null bij geen overlap', () => {
		const sy = getSchoolYearForDateString('2026-09-15');
		expect(clampToSchoolYear(sy, '2030-01-01', '2030-12-31')).toBeNull();
	});
});

describe('pickAgeTariff', () => {
	it('onder 21 op verjaardag - 1 dag = under_21', () => {
		expect(pickAgeTariff('2005-09-02', '2026-09-01')).toBe('under_21');
	});
	it('exact 21e verjaardag = adult', () => {
		expect(pickAgeTariff('2005-09-01', '2026-09-01')).toBe('adult');
	});
	it('null DOB → adult (veiligste fallback)', () => {
		expect(pickAgeTariff(null, '2026-09-01')).toBe('adult');
	});
	it('pickPriceCents kiest juiste tarief', () => {
		const opt = { price_per_lesson_under_21_cents: 1950, price_per_lesson_adult_cents: 2360 };
		expect(pickPriceCents(opt, 'under_21')).toBe(1950);
		expect(pickPriceCents(opt, 'adult')).toBe(2360);
	});
});

describe('calculateYearlyAmount', () => {
	it('telt wekelijkse lessen in een vol schooljaar exclusief augustus', () => {
		// Maandagen tussen 1 sept 2026 en 31 jul 2027, augustus telt niet.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-01',
			periodEnd: '2027-07-31',
			dayOfWeek: 1, // maandag
			frequency: 'weekly',
			pricePerLessonCents: 1950,
		});
		// Sanity: in een schooljaar zonder vakantieaftrek zo'n 47-48 maandagen.
		expect(result.lessonsCount).toBeGreaterThan(40);
		expect(result.lessonsCount).toBeLessThan(50);
		expect(result.yearlyCents).toBe(result.lessonsCount * 1950);
		expect(result.monthlyCents * 11 + result.leftoverCents).toBe(result.yearlyCents);
	});

	it('trekt lesvrije periodes (vakanties) af', () => {
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

	it('tweewekelijks telt ongeveer de helft van wekelijks', () => {
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

	it('geeft 0 bij prijs 0 of omgekeerd venster', () => {
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

	it('augustus-lessen worden altijd uitgesloten', () => {
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
