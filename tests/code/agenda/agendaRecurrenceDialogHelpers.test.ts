import { describe, expect, it } from 'bun:test';
import type { RecurrenceScope } from '../../../src/components/agenda/RecurrenceChoiceDialog';
import {
	buildCancelLessonConfirmHandler,
	handleRecurrenceDialogOpenChange,
	resolveConfirmCancelInitialIds,
	resolveConfirmCancelParticipants,
	resolveRecurrenceScopeChoice,
	resolveRecurrenceScopeChoiceSideEffect,
	shouldClearPendingDropOnRecurrenceClose,
	shouldHideFutureCancelOption,
} from '../../../src/lib/agenda/agendaRecurrenceDialogHelpers';
import type { CancellationType } from '../../../src/types/agenda-events';

describe('shouldHideFutureCancelOption', () => {
	it('returns false for change action', () => {
		expect(shouldHideFutureCancelOption('change', { isLesson: true })).toBe(false);
	});

	it('returns false for cancel action on non-lesson resources', () => {
		expect(shouldHideFutureCancelOption('cancel', { isLesson: false, sourceType: 'other' })).toBe(false);
	});

	it('returns true for cancel action on lesson resources', () => {
		expect(shouldHideFutureCancelOption('cancel', { isLesson: true })).toBe(true);
	});

	it('returns true for cancel action on lesson agreement resources', () => {
		expect(shouldHideFutureCancelOption('cancel', { sourceType: 'lesson_agreement' })).toBe(true);
	});
});

describe('resolveRecurrenceScopeChoice', () => {
	it('returns apply-drop for change action with pending drop', () => {
		expect(
			resolveRecurrenceScopeChoice({
				action: 'change',
				scope: 'single',
				hasPendingDrop: true,
			}),
		).toEqual({ kind: 'apply-drop', scope: 'single' });
	});

	it('returns open-cancel-confirm for cancel action', () => {
		expect(
			resolveRecurrenceScopeChoice({
				action: 'cancel',
				scope: 'thisAndFuture',
				hasPendingDrop: false,
			}),
		).toEqual({ kind: 'open-cancel-confirm', scope: 'thisAndFuture' });
	});

	it('returns noop when change action has no pending drop', () => {
		expect(
			resolveRecurrenceScopeChoice({
				action: 'change',
				scope: 'single',
				hasPendingDrop: false,
			}),
		).toEqual({ kind: 'noop' });
	});
});

describe('shouldClearPendingDropOnRecurrenceClose', () => {
	it('returns true when dialog closes', () => {
		expect(shouldClearPendingDropOnRecurrenceClose(false)).toBe(true);
	});

	it('returns false when dialog stays open', () => {
		expect(shouldClearPendingDropOnRecurrenceClose(true)).toBe(false);
	});
});

describe('handleRecurrenceDialogOpenChange', () => {
	it('clears pending drop when the dialog closes', () => {
		let open = true;
		let pendingCleared = false;
		handleRecurrenceDialogOpenChange(
			false,
			(value) => {
				open = value;
			},
			() => {
				pendingCleared = true;
			},
		);
		expect(open).toBe(false);
		expect(pendingCleared).toBe(true);
	});
});

describe('resolveRecurrenceScopeChoiceSideEffect', () => {
	it('mirrors resolveRecurrenceScopeChoice', () => {
		expect(
			resolveRecurrenceScopeChoiceSideEffect({
				action: 'cancel',
				scope: 'single',
				hasPendingDrop: false,
			}),
		).toEqual({ kind: 'open-cancel-confirm', scope: 'single' });
	});
});

describe('resolveConfirmCancelParticipants', () => {
	it('returns participants for group lessons only', () => {
		const participants = [
			{
				user_id: 'user-1',
				first_name: 'Anna',
				last_name: 'A',
				email: 'anna@example.com',
				avatar_url: null,
				phone_number: null,
			},
		];
		expect(
			resolveConfirmCancelParticipants({
				resource: { isGroupLesson: true, users: participants },
			}),
		).toEqual(participants);
		expect(resolveConfirmCancelParticipants({ resource: { isGroupLesson: false } })).toBeUndefined();
	});
});

describe('resolveConfirmCancelInitialIds', () => {
	it('returns cancelled participant ids when present', () => {
		expect(
			resolveConfirmCancelInitialIds({
				resource: { cancelledParticipantIds: ['user-1'] },
			}),
		).toEqual(['user-1']);
		expect(resolveConfirmCancelInitialIds(null)).toBeNull();
	});
});

describe('buildCancelLessonConfirmHandler', () => {
	it('forwards cancel scope and participant ids to the handler', async () => {
		let receivedScope: RecurrenceScope | undefined;
		let receivedCancellationType: CancellationType | undefined;
		let receivedCancelledIds: string[] | null | undefined;
		const handler = buildCancelLessonConfirmHandler('single', async (scope, cancellationType, cancelledIds) => {
			receivedScope = scope;
			receivedCancellationType = cancellationType;
			receivedCancelledIds = cancelledIds;
		});
		await handler('student', ['user-1']);
		expect(receivedScope).toBe('single');
		expect(receivedCancellationType).toBe('student');
		expect(receivedCancelledIds).toEqual(['user-1']);
	});
});
