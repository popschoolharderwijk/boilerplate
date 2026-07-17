import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { CalendarEvent } from '../../../src/components/agenda/types';
import type { MoveAgendaEventResult } from '../../../src/lib/agenda/moveAgendaEvent';
import * as moveAgendaEventModule from '../../../src/lib/agenda/moveAgendaEvent';
import * as notifyAgendaOpResultModule from '../../../src/lib/agenda/notifyAgendaOpResult';

const toastCalls: { kind: 'error' | 'success'; message: string }[] = [];

mock.module('sonner', () => ({
	toast: {
		error: (message: string) => {
			toastCalls.push({ kind: 'error', message });
		},
		success: (message: string) => {
			toastCalls.push({ kind: 'success', message });
		},
	},
}));

const uiState = {
	pendingDrop: null as { event: CalendarEvent; start: Date; end: Date } | null,
	recurrenceChoiceAction: null as string | null,
	recurrenceChoiceOpen: false,
	optimisticMove: null as unknown,
};

const ui = {
	setPendingDrop: (value: { event: CalendarEvent; start: Date; end: Date } | null) => {
		uiState.pendingDrop = value;
	},
	setRecurrenceChoiceAction: (value: string | null) => {
		uiState.recurrenceChoiceAction = value;
	},
	setRecurrenceChoiceOpen: (value: boolean) => {
		uiState.recurrenceChoiceOpen = value;
	},
	setOptimisticMove: (value: unknown) => {
		uiState.optimisticMove = value;
	},
};

let moveResult: MoveAgendaEventResult = { ok: true, message: '' };
let notifyCalled = false;

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

describe('executeAgendaEventDrop', () => {
	let executeAgendaEventDrop: typeof import('../../../src/components/agenda/agendaViewDropHelpers').executeAgendaEventDrop;
	let moveAgendaEventSpy: ReturnType<typeof spyOn>;
	let notifyAgendaOpResultSpy: ReturnType<typeof spyOn>;

	beforeAll(async () => {
		({ executeAgendaEventDrop } = await import('../../../src/components/agenda/agendaViewDropHelpers'));
	});

	beforeEach(() => {
		toastCalls.length = 0;
		moveResult = { ok: true, message: '' };
		notifyCalled = false;
		uiState.pendingDrop = null;
		uiState.recurrenceChoiceAction = null;
		uiState.recurrenceChoiceOpen = false;
		uiState.optimisticMove = null;
		moveAgendaEventSpy = spyOn(moveAgendaEventModule, 'moveAgendaEvent').mockImplementation(async () => moveResult);
		notifyAgendaOpResultSpy = spyOn(notifyAgendaOpResultModule, 'notifyAgendaOpResult').mockImplementation(
			async (_result: notifyAgendaOpResultModule.AgendaOpResult, onSuccess?: () => void | Promise<void>) => {
				notifyCalled = true;
				await onSuccess?.();
				return true;
			},
		);
	});

	afterEach(() => {
		moveAgendaEventSpy.mockRestore();
		notifyAgendaOpResultSpy.mockRestore();
	});

	it('does nothing when drop times match original times', async () => {
		const event = mockEvent({ resource: { ...mockEvent().resource, isRecurring: true } });
		await executeAgendaEventDrop({
			args: { event, start: event.start as Date, end: event.end as Date },
			scope: 'single',
			skipRecurrencePrompt: false,
			canEdit: true,
			user: { id: 'user-1' } as never,
			agendaEvents: [],
			deviations: [],
			agreementsMap: new Map(),
			reloadAgenda: () => {},
			ui: ui as never,
		});
		expect(uiState.recurrenceChoiceOpen).toBe(false);
		expect(uiState.optimisticMove).toBeNull();
		expect(moveAgendaEventSpy).toHaveBeenCalledTimes(0);
	});

	it('opens recurrence dialog for recurring events moved to a new time', async () => {
		const event = mockEvent({ resource: { ...mockEvent().resource, isRecurring: true } });
		const start = new Date('2026-09-07T16:00:00');
		const end = new Date('2026-09-07T17:00:00');
		await executeAgendaEventDrop({
			args: { event, start, end },
			scope: 'single',
			skipRecurrencePrompt: false,
			canEdit: true,
			user: { id: 'user-1' } as never,
			agendaEvents: [],
			deviations: [],
			agreementsMap: new Map(),
			reloadAgenda: () => {},
			ui: ui as never,
		});
		expect(uiState.pendingDrop).toEqual({ event, start, end });
		expect(uiState.recurrenceChoiceAction).toBe('change');
		expect(uiState.recurrenceChoiceOpen).toBe(true);
		expect(moveAgendaEventSpy).toHaveBeenCalledTimes(0);
	});

	it('moves non-recurring manual events and clears optimistic state on success', async () => {
		const event = mockEvent({
			resource: {
				...mockEvent().resource,
				sourceType: 'manual',
				isRecurring: false,
			},
		});
		const start = new Date('2026-09-07T16:00:00');
		const end = new Date('2026-09-07T17:00:00');
		await executeAgendaEventDrop({
			args: { event, start, end },
			scope: 'single',
			skipRecurrencePrompt: false,
			canEdit: true,
			user: { id: 'user-1' } as never,
			agendaEvents: [],
			deviations: [],
			agreementsMap: new Map(),
			reloadAgenda: () => {},
			ui: ui as never,
		});
		expect(uiState.optimisticMove).toBeNull();
		expect(moveAgendaEventSpy).toHaveBeenCalledTimes(1);
		expect(toastCalls).toHaveLength(0);
	});

	it('shows error toast and clears optimistic move when move fails', async () => {
		moveResult = { ok: false, message: 'failed' };
		const event = mockEvent({
			resource: {
				...mockEvent().resource,
				sourceType: 'manual',
				isRecurring: false,
			},
		});
		await executeAgendaEventDrop({
			args: {
				event,
				start: new Date('2026-09-07T16:00:00'),
				end: new Date('2026-09-07T17:00:00'),
			},
			scope: 'single',
			skipRecurrencePrompt: false,
			canEdit: true,
			user: { id: 'user-1' } as never,
			agendaEvents: [],
			deviations: [],
			agreementsMap: new Map(),
			reloadAgenda: () => {},
			ui: ui as never,
		});
		expect(uiState.optimisticMove).toBeNull();
		expect(toastCalls).toEqual([{ kind: 'error', message: 'failed' }]);
		expect(notifyAgendaOpResultSpy).toHaveBeenCalledTimes(0);
	});

	it('does not move events when edit permission is missing', async () => {
		const event = mockEvent({
			resource: {
				...mockEvent().resource,
				sourceType: 'manual',
				isRecurring: false,
			},
		});
		await executeAgendaEventDrop({
			args: {
				event,
				start: new Date('2026-09-07T16:00:00'),
				end: new Date('2026-09-07T17:00:00'),
			},
			scope: 'single',
			skipRecurrencePrompt: false,
			canEdit: false,
			user: { id: 'user-1' } as never,
			agendaEvents: [],
			deviations: [],
			agreementsMap: new Map(),
			reloadAgenda: () => {},
			ui: ui as never,
		});
		expect(uiState.optimisticMove).toBeNull();
		expect(moveAgendaEventSpy).toHaveBeenCalledTimes(0);
	});

	it('notifies and reloads when move succeeds with a message', async () => {
		moveResult = { ok: true, message: 'saved' };
		let reloaded = false;
		const event = mockEvent({
			resource: {
				...mockEvent().resource,
				sourceType: 'manual',
				isRecurring: false,
			},
		});
		await executeAgendaEventDrop({
			args: {
				event,
				start: new Date('2026-09-07T16:00:00'),
				end: new Date('2026-09-07T17:00:00'),
			},
			scope: 'single',
			skipRecurrencePrompt: false,
			canEdit: true,
			user: { id: 'user-1' } as never,
			agendaEvents: [],
			deviations: [],
			agreementsMap: new Map(),
			reloadAgenda: () => {
				reloaded = true;
			},
			ui: ui as never,
		});
		expect(notifyCalled).toBe(true);
		expect(reloaded).toBe(true);
		expect(uiState.optimisticMove).toBeNull();
	});
});
