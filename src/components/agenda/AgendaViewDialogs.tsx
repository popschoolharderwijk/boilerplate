import type { User } from '@supabase/supabase-js';
import { AgendaEventFormDialogContainer } from '@/components/agenda/AgendaEventFormDialogContainer';
import { AgendaRecurrenceDialogs } from '@/components/agenda/AgendaRecurrenceDialogs';
import type { AgendaViewDerivedState } from '@/components/agenda/agendaViewDerivedState';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import { StudentInfoModal } from '@/components/students/StudentInfoModal';
import type { useAgendaUI } from '@/hooks/useAgendaUI';
import type { CancellationType } from '@/types/agenda-events';

type AgendaUI = ReturnType<typeof useAgendaUI>;

interface AgendaViewDialogsProps {
	ui: AgendaUI;
	derived: AgendaViewDerivedState;
	canEdit: boolean;
	canManageAgenda: boolean;
	user: User | null;
	reloadAgenda: () => void | Promise<void>;
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

export function AgendaViewDialogs(props: AgendaViewDialogsProps) {
	const { ui, derived, canEdit, canManageAgenda, user, reloadAgenda, handleEventDrop, handleCancelLesson } = props;

	return (
		<>
			<AgendaRecurrenceDialogs
				ui={ui}
				handleEventDrop={handleEventDrop}
				handleCancelLesson={handleCancelLesson}
			/>

			<StudentInfoModal
				open={ui.studentInfoModal.open}
				onOpenChange={(open) => ui.setStudentInfoModal({ ...ui.studentInfoModal, open })}
				student={ui.studentInfoModal.student}
			/>

			<AgendaEventFormDialogContainer
				ui={ui}
				derived={derived}
				canEdit={canEdit}
				canManageAgenda={canManageAgenda}
				user={user}
				reloadAgenda={reloadAgenda}
				handleCancelLesson={() => handleCancelLesson('single')}
			/>
		</>
	);
}
