import { describe, expect, it } from 'bun:test';
import {
	executeAgendaDelete,
	getAgendaRevertErrorMessage,
	resolveAgendaDeleteClickAction,
	resolveAgendaFormSubmitAction,
} from '../../../src/components/agenda/agendaEventFormActionHelpers';
import type { DeleteScope } from '../../../src/types/agenda-events';

const baseSubmitInput = {
	userId: 'user-1',
	startDate: '2026-09-01',
	startTime: '09:00',
	isProjectEvent: false,
	selectedProjectId: null,
	eventId: undefined,
	isRecurringEvent: false,
};

describe('resolveAgendaFormSubmitAction', () => {
	it('returns missing-fields when required values are absent', () => {
		expect(resolveAgendaFormSubmitAction({ ...baseSubmitInput, userId: undefined })).toBe('missing-fields');
		expect(resolveAgendaFormSubmitAction({ ...baseSubmitInput, startDate: null })).toBe('missing-fields');
		expect(resolveAgendaFormSubmitAction({ ...baseSubmitInput, startTime: '' })).toBe('missing-fields');
	});

	it('returns missing-project for new project events without a project', () => {
		expect(
			resolveAgendaFormSubmitAction({
				...baseSubmitInput,
				isProjectEvent: true,
				selectedProjectId: null,
				eventId: undefined,
			}),
		).toBe('missing-project');
	});

	it('opens recurrence editor for recurring edits', () => {
		expect(
			resolveAgendaFormSubmitAction({
				...baseSubmitInput,
				eventId: 'event-1',
				isRecurringEvent: true,
			}),
		).toBe('open-recurrence');
	});

	it('saves immediately when validation passes', () => {
		expect(resolveAgendaFormSubmitAction(baseSubmitInput)).toBe('save-all');
	});
});

describe('resolveAgendaDeleteClickAction', () => {
	it('returns noop when delete is not allowed', () => {
		expect(
			resolveAgendaDeleteClickAction({
				canDelete: false,
				eventId: 'event-1',
				isRecurringEvent: false,
			}),
		).toBe('noop');
	});

	it('opens recurrence dialog for recurring events', () => {
		expect(
			resolveAgendaDeleteClickAction({
				canDelete: true,
				eventId: 'event-1',
				isRecurringEvent: true,
			}),
		).toBe('open-recurrence');
	});

	it('opens confirm dialog for single events', () => {
		expect(
			resolveAgendaDeleteClickAction({
				canDelete: true,
				eventId: 'event-1',
				isRecurringEvent: false,
			}),
		).toBe('open-confirm');
	});
});

describe('getAgendaRevertErrorMessage', () => {
	it('returns the error message for Error instances', () => {
		expect(getAgendaRevertErrorMessage(new Error('Revert failed'))).toBe('Revert failed');
	});

	it('returns the default message for unknown errors', () => {
		expect(getAgendaRevertErrorMessage('boom')).toBe('Terugzetten mislukt');
	});
});

describe('executeAgendaDelete', () => {
	it('calls delete and closes the dialog when allowed', async () => {
		let closed = false;
		const result: { scope: DeleteScope | null } = { scope: null };
		await executeAgendaDelete({
			canDelete: true,
			eventId: 'event-1',
			onDelete: async (_eventId, scope) => {
				result.scope = scope;
			},
			scope: 'all',
			onOpenChange: (open) => {
				closed = !open;
			},
		});
		expect(result.scope).toBe('all');
		expect(closed).toBe(true);
	});

	it('does nothing when delete is not allowed', async () => {
		let deleted = false;
		await executeAgendaDelete({
			canDelete: false,
			eventId: 'event-1',
			onDelete: async () => {
				deleted = true;
			},
			scope: 'all',
			onOpenChange: () => undefined,
		});
		expect(deleted).toBe(false);
	});

	it('does nothing when event id is missing', async () => {
		let deleted = false;
		await executeAgendaDelete({
			canDelete: true,
			eventId: undefined,
			onDelete: async () => {
				deleted = true;
			},
			scope: 'all',
			onOpenChange: () => undefined,
		});
		expect(deleted).toBe(false);
	});

	it('does nothing when delete handler is missing', async () => {
		let closed = false;
		await executeAgendaDelete({
			canDelete: true,
			eventId: 'event-1',
			onDelete: undefined,
			scope: 'all',
			onOpenChange: (open) => {
				closed = !open;
			},
		});
		expect(closed).toBe(false);
	});
});
