import { AgendaEventFormDialogContent } from '@/components/agenda/AgendaEventFormDialogContent';
import {
	type AgendaEventFormDialogProps,
	useAgendaEventFormDialog,
} from '@/components/agenda/useAgendaEventFormDialog';

export type { DeleteScope, DeviationInfo } from '@/types/agenda-events';
export type { AgendaEventFormDialogProps };

export function AgendaEventFormDialog(props: AgendaEventFormDialogProps) {
	const ctx = useAgendaEventFormDialog(props);
	return <AgendaEventFormDialogContent ctx={ctx} />;
}
