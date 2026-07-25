import type { AgendaEventIconType } from '@/lib/agenda/agendaEventDisplay';
import { AGENDA_EVENT_TYPE_ICON_CLASS, resolveAgendaEventTypeIconMeta } from '@/lib/agenda/agendaEventTypeIconHelpers';

interface AgendaEventTypeIconProps {
	iconType: AgendaEventIconType;
	iconColorClass: string;
}

export function AgendaEventTypeIcon({ iconType, iconColorClass }: AgendaEventTypeIconProps) {
	const meta = resolveAgendaEventTypeIconMeta(iconType);
	if (!meta) return null;

	const { Icon, title } = meta;
	const className = `${AGENDA_EVENT_TYPE_ICON_CLASS} ${iconColorClass}`;

	return <Icon className={className} title={title} aria-hidden />;
}
