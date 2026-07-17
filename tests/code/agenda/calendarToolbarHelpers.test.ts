import { describe, expect, it } from 'bun:test';
import { resolveCalendarViewLabel, resolveCalendarViewOptions } from '../../../src/lib/agenda/calendarToolbarHelpers';

describe('resolveCalendarViewOptions', () => {
	it('returns array views unchanged when they have Dutch labels', () => {
		expect(resolveCalendarViewOptions(['month', 'week'])).toEqual(['month', 'week']);
	});

	it('filters enabled views from object map', () => {
		expect(resolveCalendarViewOptions({ month: true, week: false, day: true })).toEqual(['month', 'day']);
	});

	it('keeps only views with Dutch labels', () => {
		expect(resolveCalendarViewOptions(['month', 'work_week'])).toEqual(['month']);
	});
});

describe('resolveCalendarViewLabel', () => {
	it('prefers built-in Dutch labels', () => {
		expect(resolveCalendarViewLabel('week', {})).toBe('Week');
	});

	it('falls back to localizer messages', () => {
		expect(resolveCalendarViewLabel('work_week', { work_week: 'Werkweek' })).toBe('Werkweek');
	});
});
