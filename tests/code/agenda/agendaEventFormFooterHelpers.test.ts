import { describe, expect, it } from 'bun:test';
import type { AgendaEventFormPermissions } from '../../../src/components/agenda/agenda-event-form-types';
import {
	getAsyncActionLabel,
	getCloseButtonLabel,
	getFooterLayoutClass,
	getSubmitButtonLabel,
	hasLeftFooterActions,
	isFooterBusy,
	isSubmitDisabled,
} from '../../../src/lib/agenda/agendaEventFormFooterHelpers';

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

describe('hasLeftFooterActions', () => {
	it('returns true when delete is allowed', () => {
		expect(hasLeftFooterActions({ ...basePermissions, canCancelLesson: false, canDelete: true })).toBe(true);
	});

	it('returns false when no left actions are allowed', () => {
		expect(
			hasLeftFooterActions({
				...basePermissions,
				canDelete: false,
				canCancelLesson: false,
				canMarkTrialCompleted: false,
			}),
		).toBe(false);
	});
});

describe('getFooterLayoutClass', () => {
	it('uses space-between when left actions exist', () => {
		expect(getFooterLayoutClass(true)).toBe('flex-wrap gap-2 sm:justify-between');
	});

	it('uses end alignment when no left actions exist', () => {
		expect(getFooterLayoutClass(false)).toBe('flex-wrap gap-2 sm:justify-end');
	});
});

describe('footer button labels', () => {
	it('returns close label for cancelled events', () => {
		expect(getCloseButtonLabel(true)).toBe('Sluiten');
	});

	it('returns cancel label for active events', () => {
		expect(getCloseButtonLabel(false)).toBe('Annuleren');
	});

	it('returns saving label while submitting', () => {
		expect(getSubmitButtonLabel(true, true)).toBe('Opslaan...');
	});

	it('returns create label for new events', () => {
		expect(getSubmitButtonLabel(false, false)).toBe('Aanmaken');
	});

	it('returns busy label while action is running', () => {
		expect(getAsyncActionLabel(true, 'Les annuleren')).toBe('Bezig...');
	});
});

describe('isSubmitDisabled', () => {
	it('disables submit while saving', () => {
		expect(
			isSubmitDisabled(
				{
					saving: true,
					reverting: false,
					isCancelling: false,
					isMarkingTrialCompleted: false,
					hasChanges: true,
					isEditing: true,
				},
				false,
			),
		).toBe(true);
	});

	it('disables submit when editing without changes', () => {
		expect(
			isSubmitDisabled(
				{
					saving: false,
					reverting: false,
					isCancelling: false,
					isMarkingTrialCompleted: false,
					hasChanges: false,
					isEditing: true,
				},
				false,
			),
		).toBe(true);
	});
});

describe('isFooterBusy', () => {
	it('returns true when reverting', () => {
		expect(
			isFooterBusy({
				saving: false,
				reverting: true,
				isCancelling: false,
				isMarkingTrialCompleted: false,
				hasChanges: false,
				isEditing: false,
			}),
		).toBe(true);
	});
});
