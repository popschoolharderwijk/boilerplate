import { resolveAgendaProjectSourceSelection } from '@/components/agenda/agendaEventFormDialogContentHelpers';
import type { AgendaEventFormDialogContext } from '@/components/agenda/useAgendaEventFormDialog';
import { ProjectButton } from '@/components/ui/project-button';

interface AgendaEventFormProjectSourceFieldProps {
	ctx: Pick<AgendaEventFormDialogContext, 'isPrivileged' | 'sourceSelection' | 'permissions' | 'event'>;
}

export function AgendaEventFormProjectSourceField({ ctx }: AgendaEventFormProjectSourceFieldProps) {
	if (!ctx.isPrivileged) {
		return null;
	}

	return (
		<ProjectButton
			value={ctx.sourceSelection.selectedProjectId}
			options={ctx.sourceSelection.projectOptions}
			onChange={(id) => {
				const selection = resolveAgendaProjectSourceSelection(id);
				ctx.sourceSelection.setSelectedProjectId(selection.selectedProjectId);
				ctx.sourceSelection.setSelectedSourceType(selection.selectedSourceType);
			}}
			disabled={ctx.permissions.isCancelledEvent}
			readOnly={Boolean(ctx.event)}
		/>
	);
}
