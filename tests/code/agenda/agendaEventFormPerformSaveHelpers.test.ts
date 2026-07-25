import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as agendaEventFormSave from '../../../src/lib/agenda/agendaEventFormSave';

const toastCalls: { kind: 'error'; message: string }[] = [];
let saveShouldThrow = false;
let saveCalled = false;

mock.module('sonner', () => ({
	toast: {
		error: (message: string) => {
			toastCalls.push({ kind: 'error', message });
		},
	},
}));

const baseParams = {
	scope: 'all' as const,
	userId: 'user-1',
	formFields: {
		startDate: '2026-09-01',
		startTime: '09:00',
		endDate: '2026-09-01',
		endTime: '10:00',
		isAllDay: false,
		recurring: false,
		recurringFrequency: 'weekly' as const,
		recurringEndDate: null,
		color: '#ff0000',
		title: 'Les',
		description: 'Omschrijving',
	},
	participantIds: ['student-1'],
	initialParticipantIds: [],
	event: null,
	occurrenceDate: null,
	occurrenceStartTime: null,
	externalSourceType: undefined,
	externalSourceId: null,
	setSaving: () => {},
	onOpenChange: () => {},
};

describe('runPerformAgendaEventSave', () => {
	let runPerformAgendaEventSave: typeof import('../../../src/lib/agenda/agendaEventFormPerformSaveHelpers').runPerformAgendaEventSave;

	beforeAll(async () => {
		({ runPerformAgendaEventSave } = await import('../../../src/lib/agenda/agendaEventFormPerformSaveHelpers'));
	});

	beforeEach(() => {
		toastCalls.length = 0;
		saveCalled = false;
		saveShouldThrow = false;
		spyOn(agendaEventFormSave, 'saveAgendaEventForm').mockImplementation(async () => {
			saveCalled = true;
			if (saveShouldThrow) {
				throw new Error('save failed');
			}
		});
		spyOn(agendaEventFormSave, 'formatAgendaEventSaveError').mockImplementation((error: unknown) =>
			error instanceof Error ? error.message : 'Save failed',
		);
	});

	afterEach(() => {
		mock.restore();
	});

	it('returns early when required fields are missing', async () => {
		let saving = false;
		await runPerformAgendaEventSave({
			...baseParams,
			userId: undefined,
			setSaving: (value) => {
				saving = value;
			},
		});
		expect(saveCalled).toBe(false);
		expect(saving).toBe(false);
	});

	it('saves the event and closes the dialog on success', async () => {
		let saving = false;
		let dialogOpen = true;
		let successCalled = false;

		await runPerformAgendaEventSave({
			...baseParams,
			setSaving: (value) => {
				saving = value;
			},
			onOpenChange: (open) => {
				dialogOpen = open;
			},
			onSuccess: () => {
				successCalled = true;
			},
		});

		expect(saveCalled).toBe(true);
		expect(saving).toBe(false);
		expect(dialogOpen).toBe(false);
		expect(successCalled).toBe(true);
		expect(toastCalls).toHaveLength(0);
	});

	it('shows error toast when save fails', async () => {
		saveShouldThrow = true;
		let saving = true;
		await runPerformAgendaEventSave({
			...baseParams,
			setSaving: (value) => {
				saving = value;
			},
		});

		expect(saving).toBe(false);
		expect(toastCalls).toEqual([{ kind: 'error', message: 'save failed' }]);
	});
});
