import { describe, expect, it } from 'bun:test';
import {
	buildAgendaEventFormSaveInput,
	canPerformAgendaEventSave,
	getAgendaEventSaveFields,
} from '../../../src/lib/agenda/agendaEventFormPerformSaveHelpers';

describe('canPerformAgendaEventSave', () => {
	it('returns false when required fields are missing', () => {
		expect(canPerformAgendaEventSave(undefined, '2026-09-01', '09:00')).toBe(false);
		expect(canPerformAgendaEventSave('user-1', null, '09:00')).toBe(false);
		expect(canPerformAgendaEventSave('user-1', '2026-09-01', '')).toBe(false);
	});

	it('returns true when all required fields are present', () => {
		expect(canPerformAgendaEventSave('user-1', '2026-09-01', '09:00')).toBe(true);
	});
});

describe('getAgendaEventSaveFields', () => {
	it('returns null when required fields are missing', () => {
		expect(getAgendaEventSaveFields(undefined, '2026-09-01', '09:00')).toBeNull();
	});

	it('returns narrowed save fields when validation passes', () => {
		expect(getAgendaEventSaveFields('user-1', '2026-09-01', '09:00')).toEqual({
			userId: 'user-1',
			startDate: '2026-09-01',
			startTime: '09:00',
		});
	});
});

describe('buildAgendaEventFormSaveInput', () => {
	it('maps save fields and form params into save input', () => {
		const params = {
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

		expect(
			buildAgendaEventFormSaveInput({ userId: 'user-1', startDate: '2026-09-01', startTime: '09:00' }, params),
		).toEqual({
			userId: 'user-1',
			startDate: '2026-09-01',
			startTime: '09:00',
			endDate: '2026-09-01',
			endTime: '10:00',
			isAllDay: false,
			recurring: false,
			recurringFrequency: 'weekly',
			recurringEndDate: null,
			color: '#ff0000',
			title: 'Les',
			description: 'Omschrijving',
			participantIds: ['student-1'],
			initialParticipantIds: [],
			event: null,
			occurrenceDate: null,
			occurrenceStartTime: null,
			externalSourceType: undefined,
			externalSourceId: null,
			scope: 'all',
		});
	});
});
