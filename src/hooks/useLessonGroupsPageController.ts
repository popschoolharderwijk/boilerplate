import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
	fetchLessonGroupTableRows,
	type LessonGroupTableRow,
	scheduleLessonGroupInAgenda,
} from '@/lib/lesson-groups/lessonGroupsPageHelpers';
import type { LessonGroupRow } from '@/types/lesson-groups';

interface UseLessonGroupsPageControllerParams {
	isLoading: boolean;
	canView: boolean;
	canEdit: boolean;
	navigate: NavigateFunction;
}

export function useLessonGroupsPageController(params: UseLessonGroupsPageControllerParams) {
	const [rows, setRows] = useState<LessonGroupTableRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [deleteDialog, setDeleteDialog] = useState<LessonGroupRow | null>(null);

	const load = useCallback(async () => {
		if (!params.canView) return;
		setLoading(true);
		try {
			const tableRows = await fetchLessonGroupTableRows(supabase);
			setRows(tableRows);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Onbekende fout';
			toast.error('Fout bij laden lesgroepen', { description: message });
		} finally {
			setLoading(false);
		}
	}, [params.canView]);

	useEffect(() => {
		if (!params.isLoading) {
			void load();
		}
	}, [params.isLoading, load]);

	const handleSchedule = useCallback(async (group: LessonGroupTableRow) => {
		const { error } = await scheduleLessonGroupInAgenda(group);
		if (error) {
			toast.error('Fout bij plannen in agenda', { description: error.message });
			return;
		}
		toast.success('Lesgroep gepland in agenda');
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteDialog) return;
		const { error: agendaError } = await supabase
			.from('agenda_events')
			.delete()
			.eq('source_type', 'lesson_group')
			.eq('source_id', deleteDialog.id);
		if (agendaError) {
			toast.error('Fout bij verwijderen agenda', { description: agendaError.message });
			return;
		}
		const { error } = await supabase.from('lesson_groups').delete().eq('id', deleteDialog.id);
		if (error) {
			toast.error('Fout bij verwijderen lesgroep', { description: error.message });
			return;
		}
		toast.success('Lesgroep verwijderd');
		setDeleteDialog(null);
		await load();
	}, [deleteDialog, load]);

	return {
		rows,
		loading,
		search,
		setSearch,
		deleteDialog,
		setDeleteDialog,
		confirmDelete,
		handleSchedule,
	};
}
