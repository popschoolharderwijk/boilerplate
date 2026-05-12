// Deno tests for shared billing helpers.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
	BILLING_MONTHS_PER_YEAR,
	calculateYearly,
	clampToSchoolYear,
	getOccurrenceDates,
	getSchoolYearForDateString,
	pickAgeTariff,
} from './billing.ts';

Deno.test('getSchoolYearForDateString — sept rolls into new year', () => {
	const sy = getSchoolYearForDateString('2026-09-15');
	assertEquals(sy.startYear, 2026);
	assertEquals(sy.start, '2026-09-01');
	assertEquals(sy.end, '2027-07-31');
});

Deno.test('getSchoolYearForDateString — march belongs to previous start year', () => {
	const sy = getSchoolYearForDateString('2026-03-10');
	assertEquals(sy.startYear, 2025);
});

Deno.test('clampToSchoolYear — agreement narrows window', () => {
	const sy = getSchoolYearForDateString('2026-09-15');
	const w = clampToSchoolYear(sy, '2026-10-01', '2027-05-31');
	assertEquals(w, { start: '2026-10-01', end: '2027-05-31' });
});

Deno.test('clampToSchoolYear — start after end returns null', () => {
	const sy = getSchoolYearForDateString('2026-09-15');
	const w = clampToSchoolYear(sy, '2027-08-01', null);
	assertEquals(w, null);
});

Deno.test('getOccurrenceDates — weekly aligns to dayOfWeek', () => {
	// 2026-09-01 is a Tuesday. dayOfWeek=3 (Wednesday) → first lesson 2026-09-02.
	const dates = getOccurrenceDates(3, '2026-09-01', '2026-09-30', 'weekly');
	assertEquals(dates[0], '2026-09-02');
	assertEquals(dates.length, 5);
});

Deno.test('calculateYearly — skips August and holidays', () => {
	// Weekly Wednesdays for full school year, €20.00 per lesson.
	const result = calculateYearly({
		periodStart: '2026-09-01',
		periodEnd: '2027-07-31',
		dayOfWeek: 3,
		frequency: 'weekly',
		pricePerLessonCents: 2000,
		noLessonPeriods: [{ start_date: '2026-12-21', end_date: '2027-01-04' }],
	});
	// Sanity checks: no August dates, no dates inside the holiday window.
	for (const d of result.lessonDates) {
		const inAug = d.slice(5, 7) === '08';
		const inHol = d >= '2026-12-21' && d <= '2027-01-04';
		assertEquals(inAug, false);
		assertEquals(inHol, false);
	}
	assertEquals(result.yearlyCents, result.lessonsCount * 2000);
	assertEquals(result.monthlyCents * BILLING_MONTHS_PER_YEAR + result.leftoverCents, result.yearlyCents);
});

Deno.test('pickAgeTariff — under_21 before 21st birthday, adult on/after', () => {
	assertEquals(pickAgeTariff('2010-06-15', '2026-09-01'), 'under_21');
	assertEquals(pickAgeTariff('2005-06-15', '2026-09-01'), 'adult');
	assertEquals(pickAgeTariff('2005-09-01', '2026-09-01'), 'adult');
	assertEquals(pickAgeTariff('2005-09-02', '2026-09-01'), 'under_21');
	assertEquals(pickAgeTariff(null, '2026-09-01'), 'adult');
});
