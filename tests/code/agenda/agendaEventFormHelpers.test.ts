import { describe, expect, it } from 'bun:test';
import {
	buildCreateFormSeedValues,
	buildEditFormSeedValues,
	buildInitialFormSnapshot,
	hasAgendaFormChanges,
} from '../../../src/lib/agenda/agendaEventFormHelpers';
import { formatDateToDb, now } from '../../../src/lib/date/date-format';
import type { AgendaEventRow } from '../../../src/types/agenda-events';

const baseEvent: AgendaEventRow = {
	id: 'event-1',
	source_type: 'manual',
	source_id: null,
	owner_user_id: 'user-1',
	title: 'Les',
	description: 'Omschrijving',
	start_date: '2026-09-07',
	start_time: '09:00:00',
	end_date: '2026-09-07',
	end_time: '10:00:00',
	is_all_day: false,
	recurring: true,
	recurring_frequency: 'weekly',
	recurring_end_date: '2027-07-31',
	color: '#ff0000',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	created_by: null,
	updated_by: null,
};

describe('buildInitialFormSnapshot', () => {
	it('builds snapshot from event without overrides', () => {
		expect(buildInitialFormSnapshot(baseEvent, null, null, null, null, ['user-2', 'user-1'])).toEqual({
			title: 'Les',
			description: 'Omschrijving',
			startDate: '2026-09-07',
			startTime: '09:00:00',
			endDate: '2026-09-07',
			endTime: '10:00:00',
			isAllDay: false,
			recurring: true,
			recurringFrequency: 'weekly',
			recurringEndDate: '2027-07-31',
			color: '#ff0000',
			participantIds: ['user-1', 'user-2'],
		});
	});

	it('applies occurrence overrides to snapshot fields', () => {
		expect(
			buildInitialFormSnapshot(
				baseEvent,
				'2026-09-14',
				'14:00:00',
				'15:00:00',
				{ title: 'Aangepast', description: 'Notitie', color: '#00ff00' },
				['user-1'],
			),
		).toEqual({
			title: 'Aangepast',
			description: 'Notitie',
			startDate: '2026-09-14',
			startTime: '14:00:00',
			endDate: '2026-09-14',
			endTime: '15:00:00',
			isAllDay: false,
			recurring: true,
			recurringFrequency: 'weekly',
			recurringEndDate: '2027-07-31',
			color: '#00ff00',
			participantIds: ['user-1'],
		});
	});
});

describe('hasAgendaFormChanges', () => {
	const snapshot = buildInitialFormSnapshot(baseEvent, null, null, null, null, ['user-1']);

	it('returns true when snapshot is null', () => {
		expect(
			hasAgendaFormChanges(null, {
				title: 'Les',
				description: 'Omschrijving',
				startDate: '2026-09-07',
				startTime: '09:00:00',
				endDate: '2026-09-07',
				endTime: '10:00:00',
				isAllDay: false,
				recurring: true,
				recurringFrequency: 'weekly',
				recurringEndDate: '2027-07-31',
				color: '#ff0000',
				participantIds: ['user-1'],
			}),
		).toBe(true);
	});

	it('returns false when current values match snapshot', () => {
		expect(
			hasAgendaFormChanges(snapshot, {
				title: 'Les',
				description: 'Omschrijving',
				startDate: '2026-09-07',
				startTime: '09:00:00',
				endDate: '2026-09-07',
				endTime: '10:00:00',
				isAllDay: false,
				recurring: true,
				recurringFrequency: 'weekly',
				recurringEndDate: '2027-07-31',
				color: '#ff0000',
				participantIds: ['user-1'],
			}),
		).toBe(false);
	});

	it('returns true when title changed', () => {
		expect(
			hasAgendaFormChanges(snapshot, {
				title: 'Nieuwe titel',
				description: 'Omschrijving',
				startDate: '2026-09-07',
				startTime: '09:00:00',
				endDate: '2026-09-07',
				endTime: '10:00:00',
				isAllDay: false,
				recurring: true,
				recurringFrequency: 'weekly',
				recurringEndDate: '2027-07-31',
				color: '#ff0000',
				participantIds: ['user-1'],
			}),
		).toBe(true);
	});
});

describe('buildEditFormSeedValues', () => {
	it('builds edit seed values from event', () => {
		expect(buildEditFormSeedValues(baseEvent, null, null, null, null)).toEqual({
			title: 'Les',
			description: 'Omschrijving',
			startDate: '2026-09-07',
			startTime: '09:00',
			endDate: '2026-09-07',
			endTime: '10:00',
			isAllDay: false,
			recurring: true,
			recurringFrequency: 'weekly',
			recurringEndDate: '2027-07-31',
			color: '#ff0000',
			showDescription: true,
		});
	});
});

describe('buildCreateFormSeedValues', () => {
	it('uses initial slot dates when provided', () => {
		expect(
			buildCreateFormSeedValues(
				{
					start: new Date('2026-09-07T14:00:00'),
					end: new Date('2026-09-07T15:00:00'),
				},
				'user-1',
			),
		).toEqual({
			startDate: '2026-09-07',
			startTime: '14:00',
			endDate: '2026-09-07',
			endTime: '15:00',
			participantIds: ['user-1'],
		});
	});

	it('falls back to default times without slot or user', () => {
		const today = formatDateToDb(now());
		expect(buildCreateFormSeedValues(null, undefined)).toEqual({
			startDate: today,
			startTime: '09:00',
			endDate: today,
			endTime: '10:00',
			participantIds: [],
		});
	});
});
