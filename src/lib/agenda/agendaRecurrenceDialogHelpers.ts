import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CancellationType } from '@/types/agenda-events';
import type { User } from '@/types/users';

interface RecurrenceCancelResource {
	isLesson?: boolean;
	sourceType?: string;
}

interface RecurrenceSelectedEvent {
	resource: {
		isGroupLesson?: boolean;
		users?: User[];
		cancelledParticipantIds?: string[] | null;
	};
}

export type RecurrenceScopeChoiceAction = 'change' | 'cancel' | null;

type RecurrenceScopeChoiceResult =
	| { kind: 'apply-drop'; scope: RecurrenceScope }
	| { kind: 'open-cancel-confirm'; scope: RecurrenceScope }
	| { kind: 'noop' };

function resolveRecurrenceScopeChoice(params: {
	action: RecurrenceScopeChoiceAction;
	scope: RecurrenceScope;
	hasPendingDrop: boolean;
}): RecurrenceScopeChoiceResult {
	if (params.action === 'change' && params.hasPendingDrop) {
		return { kind: 'apply-drop', scope: params.scope };
	}
	if (params.action === 'cancel') {
		return { kind: 'open-cancel-confirm', scope: params.scope };
	}
	return { kind: 'noop' };
}

function shouldClearPendingDropOnRecurrenceClose(open: boolean): boolean {
	return !open;
}

export function shouldHideFutureCancelOption(
	recurrenceChoiceAction: RecurrenceScopeChoiceAction,
	resource: RecurrenceCancelResource | undefined,
): boolean {
	if (recurrenceChoiceAction !== 'cancel') return false;
	return Boolean(resource?.isLesson || resource?.sourceType === 'lesson_agreement');
}

export function handleRecurrenceDialogOpenChange(
	open: boolean,
	setRecurrenceChoiceOpen: (open: boolean) => void,
	setPendingDrop: (drop: null) => void,
): void {
	setRecurrenceChoiceOpen(open);
	if (shouldClearPendingDropOnRecurrenceClose(open)) {
		setPendingDrop(null);
	}
}

export type RecurrenceScopeChoiceSideEffect =
	| { kind: 'apply-drop'; scope: RecurrenceScope }
	| { kind: 'open-cancel-confirm'; scope: RecurrenceScope }
	| { kind: 'noop' };

export function resolveRecurrenceScopeChoiceSideEffect(params: {
	action: RecurrenceScopeChoiceAction;
	scope: RecurrenceScope;
	hasPendingDrop: boolean;
}): RecurrenceScopeChoiceSideEffect {
	return resolveRecurrenceScopeChoice(params);
}

export function resolveConfirmCancelParticipants(
	selectedEvent: RecurrenceSelectedEvent | null | undefined,
): User[] | undefined {
	if (!selectedEvent?.resource.isGroupLesson) return undefined;
	return selectedEvent.resource.users ?? [];
}

export function resolveConfirmCancelInitialIds(
	selectedEvent: RecurrenceSelectedEvent | null | undefined,
): string[] | null {
	return selectedEvent?.resource.cancelledParticipantIds ?? null;
}

export function buildCancelLessonConfirmHandler(
	pendingCancelScope: RecurrenceScope | undefined,
	handleCancelLesson: (
		scope?: RecurrenceScope,
		cancellationType?: CancellationType,
		cancelledParticipantIds?: string[] | null,
	) => Promise<void>,
) {
	return (cancellationType: CancellationType, cancelledIds: string[] | null) =>
		handleCancelLesson(pendingCancelScope, cancellationType, cancelledIds);
}
