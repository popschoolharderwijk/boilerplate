import { describe, expect, it } from 'bun:test';
import {
	buildOptimisticMoveState,
	canExecuteEventDrop,
	resolveEventDropPreAction,
	resolveOptimisticMoveFollowUp,
	shouldClearOptimisticMoveOnFailure,
	shouldFinishOptimisticMoveAfterFailure,
	shouldFinishOptimisticMoveAfterSuccess,
	shouldNotifySuccessfulMove,
	shouldProceedWithEventDrop,
	shouldPromptRecurrenceDrop,
} from '../../../src/components/agenda/agendaViewDropHelpers';
import type { CalendarEvent } from '../../../src/components/agenda/types';

function mockEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		title: 'Les',
		start: new Date('2026-09-07T14:00:00'),
		end: new Date('2026-09-07T15:00:00'),
		resource: {
			type: 'agenda',
			agreementId: 'agr-1',
			eventId: 'event-1',
			studentName: 'Jan',
			lessonTypeName: 'Piano',
			lessonTypeColor: '#000',
			lessonTypeIcon: 'piano',
			isDeviation: false,
			isCancelled: false,
			isGroupLesson: false,
			originalDate: '2026-09-07',
		},
		...overrides,
	};
}

describe('resolveEventDropPreAction', () => {
	it('returns noop-unchanged when drop times match original times', () => {
		const event = mockEvent();
		expect(
			resolveEventDropPreAction({ event, start: event.start as Date, end: event.end as Date }, 'single', false),
		).toBe('noop-unchanged');
	});

	it('returns proceed for non-recurring manual events moved to a new time', () => {
		const event = mockEvent({
			resource: {
				...mockEvent().resource,
				sourceType: 'manual',
				isRecurring: false,
			},
		});
		expect(
			resolveEventDropPreAction(
				{
					event,
					start: new Date('2026-09-07T16:00:00'),
					end: new Date('2026-09-07T17:00:00'),
				},
				'single',
				false,
			),
		).toBe('proceed');
	});

	it('returns prompt-recurrence for recurring events', () => {
		const event = mockEvent({
			resource: {
				...mockEvent().resource,
				isRecurring: true,
			},
		});
		expect(
			resolveEventDropPreAction(
				{
					event,
					start: new Date('2026-09-07T16:00:00'),
					end: new Date('2026-09-07T17:00:00'),
				},
				'single',
				false,
			),
		).toBe('prompt-recurrence');
	});
});

describe('canExecuteEventDrop', () => {
	it('requires edit permission and a user id', () => {
		expect(canExecuteEventDrop(false, 'user-1')).toBe(false);
		expect(canExecuteEventDrop(true, undefined)).toBe(false);
		expect(canExecuteEventDrop(true, 'user-1')).toBe(true);
	});
});

describe('shouldPromptRecurrenceDrop', () => {
	it('returns true only for prompt-recurrence pre-actions', () => {
		expect(shouldPromptRecurrenceDrop('prompt-recurrence')).toBe(true);
		expect(shouldPromptRecurrenceDrop('proceed')).toBe(false);
	});
});

describe('shouldProceedWithEventDrop', () => {
	it('returns true only for proceed pre-actions', () => {
		expect(shouldProceedWithEventDrop('proceed')).toBe(true);
		expect(shouldPromptRecurrenceDrop('noop-unchanged')).toBe(false);
	});
});

describe('shouldClearOptimisticMoveOnFailure', () => {
	it('returns true only for failed move results', () => {
		expect(shouldClearOptimisticMoveOnFailure({ ok: false, message: 'failed' })).toBe(true);
		expect(shouldClearOptimisticMoveOnFailure({ ok: true })).toBe(false);
	});
});

describe('shouldNotifySuccessfulMove', () => {
	it('returns true only when the move succeeded with a message', () => {
		expect(shouldNotifySuccessfulMove({ ok: true, message: 'saved' })).toBe(true);
		expect(shouldNotifySuccessfulMove({ ok: true })).toBe(false);
		expect(shouldNotifySuccessfulMove({ ok: false, message: 'failed' })).toBe(false);
	});
});

describe('buildOptimisticMoveState', () => {
	it('captures the original event and new times', () => {
		const event = mockEvent();
		const start = new Date('2026-09-07T16:00:00');
		const end = new Date('2026-09-07T17:00:00');
		expect(buildOptimisticMoveState({ event, start, end })).toEqual({
			originalEvent: event,
			newStart: start,
			newEnd: end,
		});
	});
});

describe('shouldFinishOptimisticMoveAfterFailure', () => {
	it('returns true only for failed move results', () => {
		expect(shouldFinishOptimisticMoveAfterFailure({ ok: false, message: 'failed' })).toBe(true);
		expect(shouldFinishOptimisticMoveAfterFailure({ ok: true })).toBe(false);
	});
});

describe('shouldFinishOptimisticMoveAfterSuccess', () => {
	it('returns true only for successful move results', () => {
		expect(shouldFinishOptimisticMoveAfterSuccess({ ok: true })).toBe(true);
		expect(shouldFinishOptimisticMoveAfterSuccess({ ok: false, message: 'failed' })).toBe(false);
	});
});

describe('resolveOptimisticMoveFollowUp', () => {
	it('returns fail for failed move results', () => {
		expect(resolveOptimisticMoveFollowUp({ ok: false, message: 'failed' })).toBe('fail');
	});

	it('returns notify for successful moves with a message', () => {
		expect(resolveOptimisticMoveFollowUp({ ok: true, message: 'saved' })).toBe('notify');
	});

	it('returns done for successful moves without a message', () => {
		expect(resolveOptimisticMoveFollowUp({ ok: true })).toBe('done');
	});
});
