import { describe, expect, it } from 'bun:test';
import type { AgendaEventFormPermissions } from '../../../src/components/agenda/agenda-event-form-types';
import { resolveAgendaEventFormLeftActionVisibility } from '../../../src/lib/agenda/agendaEventFormLeftActionsHelpers';

const basePermissions: AgendaEventFormPermissions = {
	isManualEvent: false,
	isLessonEvent: true,
	isLessonGroupEvent: false,
	isProjectEvent: false,
	isRecurringEvent: true,
	isCancelledEvent: false,
	canDelete: true,
	canRevert: false,
	canCancelLesson: true,
	isTrialEvent: false,
	canMarkTrialCompleted: false,
};

describe('resolveAgendaEventFormLeftActionVisibility', () => {
	it('shows delete when delete is allowed', () => {
		expect(
			resolveAgendaEventFormLeftActionVisibility({ ...basePermissions, canDelete: true }, true, true, true)
				.showDelete,
		).toBe(true);
	});

	it('shows cancel lesson for active cancellable events', () => {
		expect(
			resolveAgendaEventFormLeftActionVisibility(
				{ ...basePermissions, isCancelledEvent: false, canCancelLesson: true },
				true,
				false,
				false,
			).showCancelLesson,
		).toBe(true);
	});

	it('shows restore lesson for cancelled events', () => {
		expect(
			resolveAgendaEventFormLeftActionVisibility(
				{ ...basePermissions, isCancelledEvent: true, canCancelLesson: true },
				false,
				true,
				false,
			).showRestoreLesson,
		).toBe(true);
	});

	it('shows mark trial completed when allowed and handler exists', () => {
		expect(
			resolveAgendaEventFormLeftActionVisibility(
				{ ...basePermissions, canMarkTrialCompleted: true },
				false,
				false,
				true,
			).showMarkTrialCompleted,
		).toBe(true);
	});

	it('hides all actions when permissions are disabled', () => {
		expect(
			resolveAgendaEventFormLeftActionVisibility(
				{
					...basePermissions,
					canDelete: false,
					canCancelLesson: false,
					canMarkTrialCompleted: false,
				},
				true,
				true,
				true,
			),
		).toEqual({
			showDelete: false,
			showCancelLesson: false,
			showRestoreLesson: false,
			showMarkTrialCompleted: false,
		});
	});
});
