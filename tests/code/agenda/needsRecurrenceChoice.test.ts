import { describe, expect, it } from 'bun:test';
import type { CalendarEvent } from '../../../src/components/agenda/types';
import { needsRecurrenceChoice } from '../../../src/lib/agenda/needsRecurrenceChoice';

function mockCalendarEvent(resourceOverrides: Partial<CalendarEvent['resource']> = {}): CalendarEvent {
	return {
		title: 'Lesson',
		start: new Date('2026-02-17T14:00:00'),
		end: new Date('2026-02-17T15:00:00'),
		resource: {
			type: 'agenda',
			agreementId: 'agr-1',
			eventId: 'event-1',
			studentName: 'Anna',
			lessonTypeName: 'Piano',
			lessonTypeColor: '#ff0000',
			lessonTypeIcon: null,
			isDeviation: false,
			isCancelled: false,
			isGroupLesson: false,
			...resourceOverrides,
		},
	};
}

describe('needsRecurrenceChoice', () => {
	it('returns false for a single cancelled deviation occurrence', () => {
		const event = mockCalendarEvent({
			isDeviation: true,
			deviationId: 'dev-1',
			isRecurring: false,
		});
		expect(needsRecurrenceChoice(event)).toBe(false);
	});

	it('returns false for non-recurring manual events', () => {
		const event = mockCalendarEvent({ sourceType: 'manual', isRecurring: false });
		expect(needsRecurrenceChoice(event)).toBe(false);
	});

	it('returns false for non-recurring project events', () => {
		const event = mockCalendarEvent({ sourceType: 'project', isRecurring: false });
		expect(needsRecurrenceChoice(event)).toBe(false);
	});

	it('returns true for recurring manual events', () => {
		const event = mockCalendarEvent({ sourceType: 'manual', isRecurring: true });
		expect(needsRecurrenceChoice(event)).toBe(true);
	});

	it('returns true for lesson agreement events', () => {
		const event = mockCalendarEvent({ sourceType: 'lesson_agreement', isRecurring: true });
		expect(needsRecurrenceChoice(event)).toBe(true);
	});
});
