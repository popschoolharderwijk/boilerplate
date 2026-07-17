import { describe, expect, it } from 'bun:test';
import { resolveAgendaEventUpdateFields } from '../../../src/lib/agenda/agendaEventUpdateHelpers';
import type { AgendaEventInsert, AgendaEventRow } from '../../../src/types/agenda-events';

const event = {
	start_date: '2026-09-01',
	start_time: '09:00:00',
	end_date: '2026-09-01',
	end_time: '10:00:00',
} as AgendaEventRow;

const payload = {
	start_date: '2026-09-07',
	start_time: '14:00:00',
	end_date: '2026-09-07',
	end_time: '15:00:00',
} as AgendaEventInsert;

describe('resolveAgendaEventUpdateFields', () => {
	it('uses payload fields for non-all scopes', () => {
		expect(resolveAgendaEventUpdateFields('single', '2026-09-07', event, payload)).toEqual({
			start_date: '2026-09-07',
			start_time: '14:00:00',
			end_date: '2026-09-07',
			end_time: '15:00:00',
		});
	});

	it('uses event fields for all scope with occurrence date', () => {
		expect(resolveAgendaEventUpdateFields('all', '2026-09-07', event, payload)).toEqual({
			start_date: '2026-09-01',
			start_time: '09:00:00',
			end_date: '2026-09-01',
			end_time: '10:00:00',
		});
	});

	it('nulls missing payload end_time', () => {
		const payloadWithoutEnd = {
			start_date: '2026-09-07',
			start_time: '14:00:00',
			end_date: '2026-09-07',
		} as AgendaEventInsert;
		expect(resolveAgendaEventUpdateFields('single', null, event, payloadWithoutEnd).end_time).toBeNull();
	});
});
