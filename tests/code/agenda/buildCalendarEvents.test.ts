import { describe, expect, it } from 'bun:test';
import type { CalendarEvent } from '../../../src/components/agenda/types';
import { buildCalendarEvents } from '../../../src/lib/agenda/buildCalendarEvents';

function mockCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	const start = new Date('2026-02-17T14:00:00');
	const end = new Date('2026-02-17T15:00:00');
	return {
		title: 'Lesson',
		start,
		end,
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
		},
		...overrides,
	};
}

describe('buildCalendarEvents', () => {
	it('returns the original list when no optimistic move is provided', () => {
		const events = [mockCalendarEvent()];
		expect(buildCalendarEvents(events, null)).toBe(events);
	});

	it('moves the matching occurrence and marks it pending', () => {
		const originalStart = new Date('2026-02-17T14:00:00');
		const originalEnd = new Date('2026-02-17T15:00:00');
		const newStart = new Date('2026-02-18T10:00:00');
		const newEnd = new Date('2026-02-18T11:00:00');
		const originalEvent = mockCalendarEvent({ start: originalStart, end: originalEnd });
		const otherOccurrence = mockCalendarEvent({
			start: new Date('2026-02-24T14:00:00'),
			end: new Date('2026-02-24T15:00:00'),
		});

		const result = buildCalendarEvents([originalEvent, otherOccurrence], {
			originalEvent,
			newStart,
			newEnd,
		});

		expect(result[0]?.start).toEqual(newStart);
		expect(result[0]?.end).toEqual(newEnd);
		expect(result[0]?.resource.isPending).toBe(true);
		expect(result[1]).toEqual(otherOccurrence);
	});

	it('marks the destination slot pending without changing its times', () => {
		const originalStart = new Date('2026-02-17T14:00:00');
		const originalEnd = new Date('2026-02-17T15:00:00');
		const destinationStart = new Date('2026-02-18T10:00:00');
		const destinationEnd = new Date('2026-02-18T11:00:00');
		const originalEvent = mockCalendarEvent({ start: originalStart, end: originalEnd });
		const destinationSlot = mockCalendarEvent({ start: destinationStart, end: destinationEnd });

		const result = buildCalendarEvents([originalEvent, destinationSlot], {
			originalEvent,
			newStart: destinationStart,
			newEnd: destinationEnd,
		});

		expect(result[1]?.start).toEqual(destinationStart);
		expect(result[1]?.end).toEqual(destinationEnd);
		expect(result[1]?.resource.isPending).toBe(true);
	});
});
