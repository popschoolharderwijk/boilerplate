import { useEffect, useState } from 'react';
import type { AgendaEventSourceSelection, ProjectOption } from '@/components/agenda/agenda-event-form-types';
import { resolveAgendaEventSourceSelection } from '@/components/agenda/agendaEventSourceSelectionHelpers';
import { supabase } from '@/integrations/supabase/client';
import type { AgendaEventRow, AgendaEventSourceType } from '@/types/agenda-events';

interface UseAgendaEventSourceSelectionParams {
	open: boolean;
	event?: AgendaEventRow | null;
	initialProjectId?: string | null;
	isPrivileged: boolean;
}

export function useAgendaEventSourceSelection({
	open,
	event,
	initialProjectId,
	isPrivileged,
}: UseAgendaEventSourceSelectionParams): AgendaEventSourceSelection {
	const [selectedSourceType, setSelectedSourceType] = useState<AgendaEventSourceType>('manual');
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
	const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);

	useEffect(() => {
		if (!open || !isPrivileged) return;
		void supabase
			.from('projects')
			.select('id, name')
			.eq('is_active', true)
			.order('name')
			.then(({ data }) => setProjectOptions(data ?? []));
	}, [open, isPrivileged]);

	useEffect(() => {
		if (!open) return;
		const selection = resolveAgendaEventSourceSelection(event, initialProjectId);
		setSelectedSourceType(selection.selectedSourceType);
		setSelectedProjectId(selection.selectedProjectId);
	}, [open, event, initialProjectId]);

	const effectiveSourceType = selectedSourceType;
	const effectiveSourceId = effectiveSourceType === 'project' ? selectedProjectId : null;

	return {
		selectedSourceType,
		selectedProjectId,
		projectOptions,
		setSelectedProjectId,
		setSelectedSourceType,
		effectiveSourceType,
		effectiveSourceId,
		isProjectEvent: effectiveSourceType === 'project',
	};
}
