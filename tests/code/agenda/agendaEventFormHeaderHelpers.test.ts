import { describe, expect, it } from 'bun:test';
import { isAgendaLessonFormHeader } from '../../../src/lib/agenda/agendaEventFormHeaderHelpers';

describe('isAgendaLessonFormHeader', () => {
	it('returns true for lesson events', () => {
		expect(isAgendaLessonFormHeader(true, false)).toBe(true);
	});

	it('returns true for lesson group events', () => {
		expect(isAgendaLessonFormHeader(false, true)).toBe(true);
	});

	it('returns false for custom events', () => {
		expect(isAgendaLessonFormHeader(false, false)).toBe(false);
	});
});
