import type { IconType } from 'react-icons';
import { LuFolderOpen, LuGraduationCap, LuMusic, LuUsers } from 'react-icons/lu';
import type { AgendaEventIconType } from '@/lib/agenda/agendaEventDisplay';

export const AGENDA_EVENT_TYPE_ICON_CLASS = 'h-3 w-3 shrink-0 mt-0.5 drop-shadow-md';

export type AgendaEventTypeIconMeta = {
	Icon: IconType;
	title: string;
};

const AGENDA_EVENT_TYPE_ICON_MAP: Record<Exclude<AgendaEventIconType, null>, AgendaEventTypeIconMeta> = {
	trial: { Icon: LuGraduationCap, title: 'Proefles' },
	project: { Icon: LuFolderOpen, title: 'Project' },
	lesson_group: { Icon: LuUsers, title: 'Groepsles' },
	duo: { Icon: LuUsers, title: 'Duo-les' },
	lesson: { Icon: LuMusic, title: 'Les' },
	multi_participant: { Icon: LuUsers, title: 'Meerdere deelnemers' },
};

export function resolveAgendaEventTypeIconMeta(iconType: AgendaEventIconType): AgendaEventTypeIconMeta | null {
	if (!iconType) return null;
	return AGENDA_EVENT_TYPE_ICON_MAP[iconType] ?? null;
}
