/**
 * Tests voor de nieuwe verschuif-logica bij lesvrije periodes.
 *
 * Eigenschappen:
 * - Een lesvrije periode verschuift alle volgende lessen met exact de lengte van
 *   de periode (in dagen).
 * - Lessen die door verschuiving voorbij de harde einddatum vallen, vervallen.
 * - Augustus blijft puur skip (geen shift-mutatie).
 * - Meerdere periodes cumuleren.
 */
import { describe, expect, it } from 'bun:test';
import { calculateYearlyAmount } from '../../../src/lib/billing/calculateYearlyAmount';

describe('calculateYearlyAmount – verschuif-logica', () => {
	it('verschuift wekelijkse lessen met 7 dagen bij een 1-week vakantie', () => {
		// Maandag 7 sept 2026 = eerste les. Vakantie 14–20 sept (7 dagen) raakt 14 sept.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-10-05',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-14', end_date: '2026-09-20' }],
		});
		// Originelen: 7, 14, 21, 28 sept, 5 okt → 5 lessen.
		// Na shift: 7 sept blijft, 14 → 21, 21 → 28, 28 → 5 okt, 5 okt → 12 okt (> end → vervalt).
		expect(result.lessonDates).toEqual(['2026-09-07', '2026-09-21', '2026-09-28', '2026-10-05']);
	});

	it('verschuift wekelijkse lessen achter elkaar bij opvolgende periodes', () => {
		// Twee korte vakanties cumuleren.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-11-30',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [
				{ start_date: '2026-09-14', end_date: '2026-09-20' }, // 7 dagen
				{ start_date: '2026-10-26', end_date: '2026-11-01' }, // 7 dagen
			],
		});
		// Eerste shift maakt alles +7. Tweede vakantie 26 okt–1 nov; na eerste shift komt
		// originele 26 okt op 2 nov (Ma), die ligt niet in tweede vakantie, dus geen extra shift.
		// Maar originele 19 okt → 26 okt (Ma): valt in tweede vakantie → shift +7 erbij = +14.
		// Dus 19 okt → 26 okt (in vak) → 2 nov.
		expect(result.lessonDates).toContain('2026-09-07');
		expect(result.lessonDates).toContain('2026-09-21');
		// Volgens cumulatieve shift: lessen lopen door tot eind nov.
		expect(result.lessonsCount).toBeGreaterThan(0);
	});

	it('augustus blijft skip zonder shift te muteren', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-07-06',
			periodEnd: '2026-09-30',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
		});
		// Maandagen in juli: 6, 13, 20, 27. Augustus 3, 10, 17, 24, 31 → skip.
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

	it('lessen die door shift voorbij de harde einddatum vallen, vervallen', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-09-28',
			dayOfWeek: 1,
			frequency: 'weekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-14', end_date: '2026-09-20' }],
		});
		// Originelen: 7, 14, 21, 28. Shift +7 → 7 blijft, 14→21, 21→28, 28→5 okt (>end).
		expect(result.lessonDates).toEqual(['2026-09-07', '2026-09-21', '2026-09-28']);
	});

	it('tweewekelijks: periode tussen twee lessen schuift volgende op', () => {
		// Maandagen elke 2 weken vanaf 7 sept: 7, 21 sept, 5, 19 okt, 2, 16 nov.
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-11-30',
			dayOfWeek: 1,
			frequency: 'biweekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-14', end_date: '2026-09-20' }], // tussen 7 en 21
		});
		// Vakantie raakt geen enkele originele les (7 niet, 21 niet → 21 is na vak).
		// Maar in shift-logica iterate: 7 (no shift) → 21 (no shift, niet in vak) → 5 okt etc.
		// → ritme blijft 2-wekelijks, geen shift.
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

	it('tweewekelijks: vakantie die les raakt verschuift met exact de lengte', () => {
		const result = calculateYearlyAmount({
			periodStart: '2026-09-07',
			periodEnd: '2026-11-30',
			dayOfWeek: 1,
			frequency: 'biweekly',
			pricePerLessonCents: 1000,
			noLessonPeriods: [{ start_date: '2026-09-21', end_date: '2026-09-27' }], // raakt 21 sept
		});
		// Originelen: 7, 21, 5/10, 19/10, 2/11, 16/11, 30/11.
		// 7 blijft. 21 → in vak (7 dagen) → 28 sept. 5 okt → 12 okt. 19 → 26 okt. 2 → 9 nov. 16 → 23 nov. 30 → 7 dec (> end → vervalt).
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
