import { describe, expect, it } from 'bun:test';
import { getAgendaEventFormPermissions } from '../../../src/components/agenda/agenda-event-form-permissions';
import type { AgendaEventRow } from '../../../src/types/agenda-events';

const noop = () => undefined;

function mockEvent(overrides: Partial<AgendaEventRow> = {}): AgendaEventRow {
	return {
		id: 'event-1',
		title: 'Lesson',
		description: null,
		start_date: '2026-02-17',
		start_time: '14:00:00',
		end_date: '2026-02-17',
		end_time: '15:00:00',
		is_all_day: false,
		recurring: false,
		recurring_frequency: null,
		recurring_end_date: null,
		color: null,
		source_type: 'manual',
		source_id: null,
		owner_user_id: 'user-1',
		created_by: null,
		updated_by: null,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

describe('getAgendaEventFormPermissions', () => {
	it('treats manual events as deletable when handlers are present', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ source_type: 'manual' }),
			selectedSourceType: 'manual',
			effectiveSourceType: 'manual',
			onDelete: noop,
		});
		expect(result.isManualEvent).toBe(true);
		expect(result.canDelete).toBe(true);
	});

	it('uses selectedSourceType when event is missing for manual detection', () => {
		const result = getAgendaEventFormPermissions({
			event: null,
			selectedSourceType: 'manual',
			effectiveSourceType: 'manual',
			onDelete: noop,
		});
		expect(result.isManualEvent).toBe(true);
		expect(result.canDelete).toBe(false);
	});

	it('marks project events via effectiveSourceType and allows delete', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ source_type: 'lesson_agreement', id: 'evt-project' }),
			selectedSourceType: 'lesson_agreement',
			effectiveSourceType: 'project',
			onDelete: noop,
		});
		expect(result.isProjectEvent).toBe(true);
		expect(result.isLessonEvent).toBe(true);
		expect(result.canDelete).toBe(true);
	});

	it('enables lesson cancel actions for lesson_agreement events', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ source_type: 'lesson_agreement' }),
			selectedSourceType: 'lesson_agreement',
			effectiveSourceType: 'lesson_agreement',
			onCancelLesson: noop,
		});
		expect(result.isLessonEvent).toBe(true);
		expect(result.isLessonGroupEvent).toBe(false);
		expect(result.canCancelLesson).toBe(true);
	});

	it('enables lesson cancel actions for lesson_group events', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ source_type: 'lesson_group' }),
			selectedSourceType: 'lesson_group',
			effectiveSourceType: 'lesson_group',
			onOpenCancelConfirm: noop,
		});
		expect(result.isLessonGroupEvent).toBe(true);
		expect(result.canCancelLesson).toBe(true);
	});

	it('blocks delete and trial completion when the event is cancelled', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ source_type: 'trial_lesson' }),
			selectedSourceType: 'trial_lesson',
			effectiveSourceType: 'trial_lesson',
			deviationInfo: {
				deviationId: 'dev-1',
				originalDate: '2026-02-17',
				originalStartTime: '14:00:00',
				isCancelled: true,
			},
			onDelete: noop,
			onMarkTrialCompleted: noop,
		});
		expect(result.isCancelledEvent).toBe(true);
		expect(result.isTrialEvent).toBe(true);
		expect(result.canDelete).toBe(false);
		expect(result.canMarkTrialCompleted).toBe(false);
	});

	it('allows trial completion for active trial lessons', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ source_type: 'trial_lesson' }),
			selectedSourceType: 'trial_lesson',
			effectiveSourceType: 'trial_lesson',
			onMarkTrialCompleted: noop,
		});
		expect(result.canMarkTrialCompleted).toBe(true);
	});

	it('allows revert when deviation info and handler are present', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ recurring: true }),
			selectedSourceType: 'manual',
			effectiveSourceType: 'manual',
			deviationInfo: {
				deviationId: 'dev-1',
				originalDate: '2026-02-17',
				originalStartTime: '14:00:00',
			},
			onRevert: noop,
		});
		expect(result.isRecurringEvent).toBe(true);
		expect(result.canRevert).toBe(true);
	});

	it('disables destructive actions without handlers or event id', () => {
		const result = getAgendaEventFormPermissions({
			event: mockEvent({ id: 'event-1', source_type: 'manual' }),
			selectedSourceType: 'manual',
			effectiveSourceType: 'manual',
		});
		expect(result.canDelete).toBe(false);
		expect(result.canRevert).toBe(false);
		expect(result.canCancelLesson).toBe(false);
		expect(result.canMarkTrialCompleted).toBe(false);
	});
});
