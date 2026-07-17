import { LuBan, LuCalendarCheck, LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { getAsyncActionLabel } from '@/lib/agenda/agendaEventFormFooterHelpers';

interface AgendaEventLeftActionButtonProps {
	disabled: boolean;
	onClick: () => void;
}

export function AgendaEventDeleteAction({ disabled, onClick }: AgendaEventLeftActionButtonProps) {
	return (
		<Button
			type="button"
			variant="outline"
			className="text-destructive hover:bg-destructive/10 hover:text-destructive"
			onClick={onClick}
			disabled={disabled}
		>
			<LuTrash2 className="h-4 w-4 mr-2" />
			Verwijderen
		</Button>
	);
}

export function AgendaEventCancelLessonAction({
	disabled,
	isCancelling,
	onClick,
}: AgendaEventLeftActionButtonProps & { isCancelling: boolean }) {
	return (
		<Button
			type="button"
			variant="outline"
			className="text-destructive hover:bg-destructive/10 hover:text-destructive"
			onClick={onClick}
			disabled={disabled}
		>
			<LuBan className="h-4 w-4 mr-2" />
			{getAsyncActionLabel(isCancelling, 'Les annuleren')}
		</Button>
	);
}

export function AgendaEventRestoreLessonAction({
	disabled,
	isCancelling,
	onClick,
}: AgendaEventLeftActionButtonProps & { isCancelling: boolean }) {
	return (
		<Button type="button" variant="outline" onClick={onClick} disabled={disabled}>
			{getAsyncActionLabel(isCancelling, 'Les herstellen')}
		</Button>
	);
}

export function AgendaEventMarkTrialCompletedAction({
	disabled,
	isMarkingTrialCompleted,
	onClick,
}: AgendaEventLeftActionButtonProps & { isMarkingTrialCompleted: boolean }) {
	return (
		<Button type="button" variant="outline" onClick={onClick} disabled={disabled}>
			<LuCalendarCheck className="h-4 w-4 mr-2" />
			{getAsyncActionLabel(isMarkingTrialCompleted, 'Markeer als gegeven')}
		</Button>
	);
}
