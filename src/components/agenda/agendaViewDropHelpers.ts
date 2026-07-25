import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import type { useAgendaData } from '@/hooks/useAgendaData';
import type { useAgendaUI } from '@/hooks/useAgendaUI';
import { moveAgendaEvent } from '@/lib/agenda/moveAgendaEvent';
import { needsRecurrenceChoice } from '@/lib/agenda/needsRecurrenceChoice';
import { notifyAgendaOpResult } from '@/lib/agenda/notifyAgendaOpResult';

type EventDropPreAction = 'noop-unchanged' | 'prompt-recurrence' | 'proceed';

function resolveEventDropPreAction(
	args: { event: CalendarEvent; start: Date; end: Date },
	scope: RecurrenceScope,
	skipRecurrencePrompt: boolean,
): EventDropPreAction {
	if (!skipRecurrencePrompt && scope === 'single') {
		const originalStart = args.event.start;
		const originalEnd = args.event.end;
		if (
			originalStart &&
			originalEnd &&
			originalStart.getTime() === args.start.getTime() &&
			originalEnd.getTime() === args.end.getTime()
		) {
			return 'noop-unchanged';
		}
		if (needsRecurrenceChoice(args.event)) {
			return 'prompt-recurrence';
		}
	}
	return 'proceed';
}

function canExecuteEventDrop(canEdit: boolean, userId: string | null | undefined): boolean {
	return canEdit && Boolean(userId);
}

function shouldPromptRecurrenceDrop(preAction: EventDropPreAction): boolean {
	return preAction === 'prompt-recurrence';
}

function shouldProceedWithEventDrop(preAction: EventDropPreAction): boolean {
	return preAction === 'proceed';
}

interface MoveAgendaEventResultLike {
	ok: boolean;
	message?: string;
}
function shouldNotifySuccessfulMove(result: MoveAgendaEventResultLike): boolean {
	return result.ok === true && Boolean(result.message);
}

type OptimisticMoveFollowUp = 'fail' | 'notify' | 'done';

function resolveOptimisticMoveFollowUp(result: MoveAgendaEventResultLike): OptimisticMoveFollowUp {
	if (!result.ok) return 'fail';
	if (shouldNotifySuccessfulMove(result)) return 'notify';
	return 'done';
}

function buildOptimisticMoveState(args: { event: CalendarEvent; start: Date; end: Date }): {
	originalEvent: CalendarEvent;
	newStart: Date;
	newEnd: Date;
} {
	return {
		originalEvent: args.event,
		newStart: args.start,
		newEnd: args.end,
	};
}
type AgendaData = ReturnType<typeof useAgendaData>;
type AgendaUI = ReturnType<typeof useAgendaUI>;

export interface ExecuteEventDropParams {
	args: { event: CalendarEvent; start: Date; end: Date };
	scope: RecurrenceScope;
	skipRecurrencePrompt: boolean;
	canEdit: boolean;
	user: User | null;
	agendaEvents: AgendaData['agendaEvents'];
	deviations: AgendaData['deviations'];
	agreementsMap: AgendaData['agreementsMap'];
	reloadAgenda: () => void;
	ui: AgendaUI;
}

export async function executeAgendaEventDrop(params: ExecuteEventDropParams): Promise<void> {
	const preAction = resolveEventDropPreAction(params.args, params.scope, params.skipRecurrencePrompt);
	if (preAction === 'noop-unchanged') return;
	if (shouldPromptRecurrenceDrop(preAction)) {
		params.ui.setPendingDrop(params.args);
		params.ui.setRecurrenceChoiceAction('change');
		params.ui.setRecurrenceChoiceOpen(true);
		return;
	}
	if (!shouldProceedWithEventDrop(preAction)) return;

	await runOptimisticAgendaEventDrop(params);
}

async function applyOptimisticMoveFollowUp(
	ui: AgendaUI,
	result: MoveAgendaEventResultLike,
	reloadAgenda: () => void,
): Promise<void> {
	const followUp = resolveOptimisticMoveFollowUp(result);
	if (followUp === 'fail') {
		ui.setOptimisticMove(null);
		toast.error(result.message);
		return;
	}
	if (followUp === 'notify') {
		await notifyAgendaOpResult({ ok: true, message: result.message ?? '' }, reloadAgenda);
	}
	ui.setOptimisticMove(null);
}

async function runOptimisticAgendaEventDrop(params: ExecuteEventDropParams): Promise<void> {
	if (!canExecuteEventDrop(params.canEdit, params.user?.id) || !params.user) return;
	params.ui.setOptimisticMove(buildOptimisticMoveState(params.args));
	const result = await moveAgendaEvent({
		event: params.args.event,
		start: params.args.start,
		end: params.args.end,
		scope: params.scope,
		user: params.user,
		agendaEvents: params.agendaEvents,
		deviations: params.deviations,
		agreementsMap: params.agreementsMap,
	});
	await applyOptimisticMoveFollowUp(params.ui, result, params.reloadAgenda);
}
