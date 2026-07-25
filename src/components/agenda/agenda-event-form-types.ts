import type { AgendaEventSourceType } from '@/types/agenda-events';

export interface ProjectOption {
	id: string;
	name: string;
}

export interface AgendaEventFormPermissions {
	isManualEvent: boolean;
	isLessonEvent: boolean;
	isLessonGroupEvent: boolean;
	isProjectEvent: boolean;
	isRecurringEvent: boolean;
	isCancelledEvent: boolean;
	canDelete: boolean;
	canRevert: boolean;
	canCancelLesson: boolean;
	isTrialEvent: boolean;
	canMarkTrialCompleted: boolean;
}

export interface AgendaEventSourceSelection {
	selectedSourceType: AgendaEventSourceType;
	selectedProjectId: string | null;
	projectOptions: ProjectOption[];
	setSelectedProjectId: (id: string | null) => void;
	setSelectedSourceType: (type: AgendaEventSourceType) => void;
	effectiveSourceType: AgendaEventSourceType;
	effectiveSourceId: string | null;
	isProjectEvent: boolean;
}
