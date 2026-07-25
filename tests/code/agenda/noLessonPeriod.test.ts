import { describe, expect, it } from 'bun:test';
import { findNoLessonPeriod, type NoLessonPeriod } from '../../../src/lib/agenda/noLessonPeriod';

const holiday: NoLessonPeriod = {
	start_date: '2026-12-21',
	end_date: '2027-01-04',
	name: 'Kerstvakantie',
};

describe('findNoLessonPeriod', () => {
	it('returns undefined when periods are undefined', () => {
		expect(findNoLessonPeriod(new Date('2026-12-25T12:00:00'), undefined)).toBeUndefined();
	});

	it('returns undefined when periods array is empty', () => {
		expect(findNoLessonPeriod(new Date('2026-12-25T12:00:00'), [])).toBeUndefined();
	});

	it('returns the matching period when the date falls inside it', () => {
		expect(findNoLessonPeriod(new Date('2026-12-25T12:00:00'), [holiday])).toEqual(holiday);
	});

	it('returns undefined when the date is before the period', () => {
		expect(findNoLessonPeriod(new Date('2026-12-20T12:00:00'), [holiday])).toBeUndefined();
	});

	it('returns undefined when the date is after the period', () => {
		expect(findNoLessonPeriod(new Date('2027-01-05T12:00:00'), [holiday])).toBeUndefined();
	});

	it('matches inclusive start and end boundaries', () => {
		expect(findNoLessonPeriod(new Date('2026-12-21T08:00:00'), [holiday])).toEqual(holiday);
		expect(findNoLessonPeriod(new Date('2027-01-04T20:00:00'), [holiday])).toEqual(holiday);
	});

	it('returns the first matching period when multiple overlap', () => {
		const periods: NoLessonPeriod[] = [
			{ start_date: '2026-12-01', end_date: '2026-12-31', name: 'December' },
			{ start_date: '2026-12-21', end_date: '2027-01-04', name: 'Kerst' },
		];
		expect(findNoLessonPeriod(new Date('2026-12-25T12:00:00'), periods)).toEqual(periods[0]);
	});
});
