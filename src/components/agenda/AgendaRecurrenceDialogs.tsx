import { ConfirmCancelDialog } from '@/components/agenda/ConfirmCancelDialog';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import { RecurrenceChoiceDialog } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import type { useAgendaUI } from '@/hooks/useAgendaUI';
import {
	buildCancelLessonConfirmHandler,
	handleRecurrenceDialogOpenChange,
	resolveConfirmCancelInitialIds,
	resolveConfirmCancelParticipants,
	resolveRecurrenceScopeChoiceSideEffect,
	shouldHideFutureCancelOption,
} from '@/lib/agenda/agendaRecurrenceDialogHelpers';
import type { CancellationType } from '@/types/agenda-events';

type AgendaUI = ReturnType<typeof useAgendaUI>;

interface AgendaRecurrenceDialogsProps {
	ui: AgendaUI;
	handleEventDrop: (
		args: { event: CalendarEvent; start: Date; end: Date },
		scope?: RecurrenceScope,
		skipRecurrencePrompt?: boolean,
	) => Promise<void>;
	handleCancelLesson: (
		scope?: RecurrenceScope,
		cancellationType?: CancellationType,
		cancelledParticipantIds?: string[] | null,
	) => Promise<void>;
}

export function AgendaRecurrenceDialogs({ ui, handleEventDrop, handleCancelLesson }: AgendaRecurrenceDialogsProps) {
	const onRecurrenceChoose = (scope: RecurrenceScope) => {
		const effect = resolveRecurrenceScopeChoiceSideEffect({
			action: ui.recurrenceChoiceAction,
			scope,
			hasPendingDrop: ui.pendingDrop !== null,
		});
		if (effect.kind === 'apply-drop' && ui.pendingDrop) {
			handleEventDrop(ui.pendingDrop, effect.scope, true);
			ui.setPendingDrop(null);
			return;
		}
		if (effect.kind === 'open-cancel-confirm') {
			ui.setPendingCancelScope(effect.scope);
			ui.setCancelLessonConfirmOpen(true);
		}
	};

	return (
		<>
			<RecurrenceChoiceDialog
				open={ui.recurrenceChoiceOpen}
				onOpenChange={(open) =>
					handleRecurrenceDialogOpenChange(open, ui.setRecurrenceChoiceOpen, ui.setPendingDrop)
				}
				action={ui.recurrenceChoiceAction}
				onChoose={onRecurrenceChoose}
				hideFutureOption={shouldHideFutureCancelOption(ui.recurrenceChoiceAction, ui.selectedEvent?.resource)}
			/>

			<ConfirmCancelDialog
				open={ui.cancelLessonConfirmOpen}
				onOpenChange={ui.setCancelLessonConfirmOpen}
				onConfirm={buildCancelLessonConfirmHandler(ui.pendingCancelScope, handleCancelLesson)}
				disabled={ui.isCancelling}
				participants={resolveConfirmCancelParticipants(ui.selectedEvent)}
				initialCancelledIds={resolveConfirmCancelInitialIds(ui.selectedEvent)}
			/>
		</>
	);
}
