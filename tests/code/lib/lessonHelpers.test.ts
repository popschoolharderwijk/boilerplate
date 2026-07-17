import { describe, expect, it } from 'bun:test';
import { formatDateToDb } from '../../../src/lib/date/date-format';
import {
	addInterval,
	addNIntervals,
	getFirstOccurrenceInRange,
	getOccurrenceDatesInRange,
	getOccurrenceIndex,
} from '../../../src/lib/lessonHelpers';

describe('addInterval', () => {
	it('advances one day for daily frequency', () => {
		const date = new Date('2026-09-07T12:00:00');
		addInterval(date, 'daily');
		expect(formatDateToDb(date)).toBe('2026-09-08');
	});

	it('advances seven days for weekly frequency', () => {
		const date = new Date('2026-09-07T12:00:00');
		addInterval(date, 'weekly');
		expect(formatDateToDb(date)).toBe('2026-09-14');
	});

	it('advances fourteen days for biweekly frequency', () => {
		const date = new Date('2026-09-07T12:00:00');
		addInterval(date, 'biweekly');
		expect(formatDateToDb(date)).toBe('2026-09-21');
	});

	it('advances one month for monthly frequency', () => {
		const date = new Date('2026-01-15T12:00:00');
		addInterval(date, 'monthly');
		expect(formatDateToDb(date)).toBe('2026-02-15');
	});
});

describe('getFirstOccurrenceInRange', () => {
	it('returns range start for daily when period starts earlier', () => {
		const result = getFirstOccurrenceInRange(
			1,
			new Date('2026-09-07T12:00:00'),
			new Date('2026-09-01T12:00:00'),
			'daily',
		);
		expect(formatDateToDb(result)).toBe('2026-09-07');
	});

	it('returns period start for daily when it is later than range start', () => {
		const result = getFirstOccurrenceInRange(
			1,
			new Date('2026-09-07T12:00:00'),
			new Date('2026-09-10T12:00:00'),
			'daily',
		);
		expect(formatDateToDb(result)).toBe('2026-09-10');
	});

	it('returns the first Monday on or after period start for weekly', () => {
		const result = getFirstOccurrenceInRange(
			1,
			new Date('2026-09-07T12:00:00'),
			new Date('2026-09-01T12:00:00'),
			'weekly',
		);
		expect(formatDateToDb(result)).toBe('2026-09-07');
	});

	it('advances weekly first occurrence when the weekday is before period start', () => {
		const result = getFirstOccurrenceInRange(
			1,
			new Date('2026-09-07T12:00:00'),
			new Date('2026-09-08T12:00:00'),
			'weekly',
		);
		expect(formatDateToDb(result)).toBe('2026-09-14');
	});

	it('returns the first biweekly occurrence inside the range', () => {
		const result = getFirstOccurrenceInRange(
			1,
			new Date('2026-09-21T12:00:00'),
			new Date('2026-09-07T12:00:00'),
			'biweekly',
		);
		expect(formatDateToDb(result)).toBe('2026-09-21');
	});

	it('returns the monthly occurrence aligned to period start day', () => {
		const result = getFirstOccurrenceInRange(
			1,
			new Date('2026-02-01T12:00:00'),
			new Date('2026-01-15T12:00:00'),
			'monthly',
		);
		expect(formatDateToDb(result)).toBe('2026-02-15');
	});
});

describe('addNIntervals', () => {
	it('returns a new date without mutating the original', () => {
		const original = new Date('2026-09-07T12:00:00');
		const result = addNIntervals(original, 2, 'weekly');
		expect(formatDateToDb(original)).toBe('2026-09-07');
		expect(formatDateToDb(result)).toBe('2026-09-21');
	});
});

describe('getOccurrenceIndex', () => {
	it('returns 0 when toDate is before fromDate', () => {
		expect(getOccurrenceIndex(new Date('2026-09-10T12:00:00'), new Date('2026-09-07T12:00:00'), 'daily')).toBe(0);
	});

	it('counts daily intervals exactly', () => {
		expect(getOccurrenceIndex(new Date('2026-09-07T12:00:00'), new Date('2026-09-10T12:00:00'), 'daily')).toBe(3);
	});

	it('counts weekly intervals exactly', () => {
		expect(getOccurrenceIndex(new Date('2026-09-07T12:00:00'), new Date('2026-09-21T12:00:00'), 'weekly')).toBe(2);
	});

	it('counts biweekly intervals exactly', () => {
		expect(getOccurrenceIndex(new Date('2026-09-07T12:00:00'), new Date('2026-09-21T12:00:00'), 'biweekly')).toBe(
			1,
		);
	});

	it('counts monthly intervals exactly', () => {
		expect(getOccurrenceIndex(new Date('2026-01-15T12:00:00'), new Date('2026-03-15T12:00:00'), 'monthly')).toBe(2);
	});
});

describe('getOccurrenceDatesInRange', () => {
	it('lists weekly Monday dates in September 2026', () => {
		const dates = getOccurrenceDatesInRange(
			1,
			new Date('2026-09-01T12:00:00'),
			new Date('2026-09-30T12:00:00'),
			'weekly',
		);
		expect(dates).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
	});

	it('lists daily dates for a short window', () => {
		const dates = getOccurrenceDatesInRange(
			1,
			new Date('2026-09-07T12:00:00'),
			new Date('2026-09-09T12:00:00'),
			'daily',
		);
		expect(dates).toEqual(['2026-09-07', '2026-09-08', '2026-09-09']);
	});
});
