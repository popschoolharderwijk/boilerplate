import { describe, expect, it } from 'bun:test';
import { getPresetDateRange } from '../../../src/lib/reports/periodPresets';

const FIXED_NOW = new Date('2026-07-15T12:00:00');

describe('getPresetDateRange', () => {
	it('returns this month boundaries', () => {
		expect(getPresetDateRange('this_month', { now: FIXED_NOW })).toEqual({
			start: '2026-07-01',
			end: '2026-07-31',
		});
	});

	it('returns last month boundaries', () => {
		expect(getPresetDateRange('last_month', { now: FIXED_NOW })).toEqual({
			start: '2026-06-01',
			end: '2026-06-30',
		});
	});

	it('returns this quarter boundaries', () => {
		expect(getPresetDateRange('this_quarter', { now: FIXED_NOW })).toEqual({
			start: '2026-07-01',
			end: '2026-09-30',
		});
	});

	it('returns last quarter boundaries', () => {
		expect(getPresetDateRange('last_quarter', { now: FIXED_NOW })).toEqual({
			start: '2026-04-01',
			end: '2026-06-30',
		});
	});

	it('returns this year boundaries', () => {
		expect(getPresetDateRange('this_year', { now: FIXED_NOW })).toEqual({
			start: '2026-01-01',
			end: '2026-12-31',
		});
	});

	it('returns last year boundaries', () => {
		expect(getPresetDateRange('last_year', { now: FIXED_NOW })).toEqual({
			start: '2025-01-01',
			end: '2025-12-31',
		});
	});

	it('returns this school year boundaries with default September start', () => {
		expect(getPresetDateRange('this_school_year', { now: FIXED_NOW })).toEqual({
			start: '2025-09-01',
			end: '2026-08-31',
		});
	});

	it('returns last school year boundaries with default September start', () => {
		expect(getPresetDateRange('last_school_year', { now: FIXED_NOW })).toEqual({
			start: '2024-09-01',
			end: '2025-08-31',
		});
	});

	it('returns this school year boundaries with a custom school start month', () => {
		expect(getPresetDateRange('this_school_year', { now: FIXED_NOW, schoolStartMonth: 8 })).toEqual({
			start: '2025-08-01',
			end: '2026-07-31',
		});
	});

	it('returns last school year boundaries with a custom school start month', () => {
		expect(getPresetDateRange('last_school_year', { now: FIXED_NOW, schoolStartMonth: 8 })).toEqual({
			start: '2024-08-01',
			end: '2025-07-31',
		});
	});

	it('falls back to this month for custom preset', () => {
		expect(getPresetDateRange('custom', { now: FIXED_NOW })).toEqual({
			start: '2026-07-01',
			end: '2026-07-31',
		});
	});
});
