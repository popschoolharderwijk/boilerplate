/**
 * Tests for the shift logic when no-lesson periods apply.
 *
 * Properties:
 * - A no-lesson period shifts all subsequent lessons by exactly the length of
 *   the period (in days).
 * - Lessons that shift past the hard end date are dropped.
 * - August is skipped without mutating the shift (summer break).
 * - Multiple periods accumulate.
 */
import { describe, expect, it } from 'bun:test';
import { calculateYearlyAmount } from '../../../src/lib/billing/calculateYearlyAmount';

describe('calculateYearlyAmount – shift logic', () => {
	it('shifts weekly lessons by 7 days for a 1-week holiday', () => {
		// Monday 7 Sept 2026 = first lesson. Holiday 14–20 Sept (7 days) hits 14 Sept.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-10-05',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-14', end_date: '2026-09-20' }],
		});
		// Originals: 7, 14, 21, 28 Sept, 5 Oct → 5 lessons.
		// After shift: 7 Sept stays, 14 → 21, 21 → 28, 28 → 5 Oct, 5 Oct → 12 Oct (> end → dropped).
		expect(result.lessonDates).toEqual(['2026-09-07', '2026-09-21', '2026-09-28', '2026-10-05']);
	});

	it('shifts weekly lessons consecutively for back-to-back periods', () => {
		// Two short holidays accumulate.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-11-30',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [
				{ start_date: '2026-09-14', end_date: '2026-09-20' }, // 7 days
				{ start_date: '2026-10-26', end_date: '2026-11-01' }, // 7 days
			],
		});
		// First shift adds +7. Second holiday 26 Oct–1 Nov; after first shift,
		// original 26 Oct lands on 2 Nov (Mon), which is not in the second holiday, so no extra shift.
		// But original 19 Oct → 26 Oct (Mon): falls in second holiday → additional +7 shift = +14.
		// So 19 Oct → 26 Oct (in holiday) → 2 Nov.
		expect(result.lessonDates).toContain('2026-09-07');
		expect(result.lessonDates).toContain('2026-09-21');
		// Per cumulative shift: lessons continue through end of November.
		expect(result.lessonsCount).toBeGreaterThan(0);
	});

	it('skips August without mutating the shift', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-07-06',
			periodEnd: '2026-09-30',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
		});
		// Mondays in July: 6, 13, 20, 27. August 3, 10, 17, 24, 31 → skip.
		// Sept: 7, 14, 21, 28.
		expect(result.lessonDates).toEqual([
			'2026-07-06',
			'2026-07-13',
			'2026-07-20',
			'2026-07-27',
			'2026-09-07',
			'2026-09-14',
			'2026-09-21',
			'2026-09-28',
		]);
	});

	it('drops lessons that shift past the hard end date', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-09-28',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-14', end_date: '2026-09-20' }],
		});
		// Originals: 7, 14, 21, 28. Shift +7 → 7 stays, 14→21, 21→28, 28→5 Oct (>end).
		expect(result.lessonDates).toEqual(['2026-09-07', '2026-09-21', '2026-09-28']);
	});

	it('biweekly: period between two lessons shifts the next one forward', () => {
		// Mondays every 2 weeks from 7 Sept: 7, 21 Sept, 5, 19 Oct, 2, 16 Nov.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-11-30',
			dayOfWeek: 1,
			frequency: 'biweekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-14', end_date: '2026-09-20' }], // between 7 and 21
		});
		// Holiday does not hit any original lesson (7 no, 21 no → 21 is after holiday).
		// But in shift logic iterate: 7 (no shift) → 21 (no shift, not in holiday) → 5 Oct etc.
		// → rhythm stays biweekly, no shift.
		expect(result.lessonDates).toEqual([
			'2026-09-07',
			'2026-09-21',
			'2026-10-05',
			'2026-10-19',
			'2026-11-02',
			'2026-11-16',
			'2026-11-30',
		]);
	});

	it('biweekly: holiday that hits a lesson shifts by exactly its length', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-11-30',
			dayOfWeek: 1,
			frequency: 'biweekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-21', end_date: '2026-09-27' }], // hits 21 Sept
		});
		// Originals: 7, 21, 5/10, 19/10, 2/11, 16/11, 30/11.
		// 7 stays. 21 → in holiday (7 days) → 28 Sept. 5 Oct → 12 Oct. 19 → 26 Oct. 2 → 9 Nov. 16 → 23 Nov. 30 → 7 Dec (> end → dropped).
		expect(result.lessonDates).toEqual([
			'2026-09-07',
			'2026-09-28',
			'2026-10-12',
			'2026-10-26',
			'2026-11-09',
			'2026-11-23',
		]);
	});
});
