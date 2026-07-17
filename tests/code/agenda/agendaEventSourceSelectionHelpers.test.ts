import { describe, expect, it } from 'bun:test';
import { resolveAgendaEventSourceSelection } from '../../../src/components/agenda/agendaEventSourceSelectionHelpers';
import type { AgendaEventRow } from '../../../src/types/agenda-events';

function mockEvent(overrides: Partial<AgendaEventRow> = {}): AgendaEventRow {
	return {
		id: 'event-1',
		title: 'Les',
		description: null,
		color: null,
		start_time: '09:00:00',
		end_time: '10:00:00',
		start_date: '2026-09-01',
		end_date: '2027-07-31',
		is_all_day: false,
		recurring: true,
		recurring_frequency: 'weekly',
		recurring_end_date: '2027-07-31',
		source_type: 'lesson_agreement',
		source_id: 'agr-1',
		owner_user_id: 'user-1',
		created_by: 'user-1',
		updated_by: null,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

describe('resolveAgendaEventSourceSelection', () => {
	it('uses event source type and project id when editing a project event', () => {
		expect(
			resolveAgendaEventSourceSelection(mockEvent({ source_type: 'project', source_id: 'proj-1' }), null),
		).toEqual({
			selectedSourceType: 'project',
			selectedProjectId: 'proj-1',
		});
	});

	it('prefers initial project id for new events', () => {
		expect(resolveAgendaEventSourceSelection(null, 'proj-2')).toEqual({
			selectedSourceType: 'project',
			selectedProjectId: 'proj-2',
		});
	});

	it('defaults to manual source when no event or project is provided', () => {
		expect(resolveAgendaEventSourceSelection(null, null)).toEqual({
			selectedSourceType: 'manual',
			selectedProjectId: null,
		});
	});
});
