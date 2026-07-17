import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { type EnrichedTrialLessonStaff, enrichTrialLessons } from '@/lib/trial-lessons/enrichTrialLessons';
import {
	buildTrialLessonConvertParams,
	buildTrialLessonConvertSearchParams,
} from '@/lib/trial-lessons/trialLessonsPageHelpers';
import { buildTrialLessonsColumns } from '@/lib/trial-lessons/trialLessonsTableColumns';

type TrialLessonRow = EnrichedTrialLessonStaff;

interface UseTrialLessonsPageControllerParams {
	isPrivileged: boolean;
	navigate: NavigateFunction;
}

export function useTrialLessonsPageController(params: UseTrialLessonsPageControllerParams) {
	const [rows, setRows] = useState<TrialLessonRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [openSchedule, setOpenSchedule] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('trial_lessons')
			.select('*')
			.order('scheduled_date', { ascending: false });
		if (error) {
			setLoading(false);
			toast.error('Fout bij laden proeflessen');
			return;
		}
		const trials = data ?? [];
		setRows((await enrichTrialLessons(trials, { includeStudent: true })) as TrialLessonRow[]);
		setLoading(false);
	}, []);

	useEffect(() => {
		if (params.isPrivileged) {
			void load();
		}
	}, [params.isPrivileged, load]);

	const setStatus = useCallback(
		async (row: TrialLessonRow, status: TrialLessonRow['status']) => {
			const { error } = await supabase
				.from('trial_lessons')
				.update({ status, admin_processed_at: new Date().toISOString() })
				.eq('id', row.id);
			if (error) {
				toast.error('Kon status niet bijwerken');
				return;
			}
			toast.success('Status bijgewerkt');
			void load();
		},
		[load],
	);

	const convert = useCallback(
		(row: TrialLessonRow) => {
			const searchParams = buildTrialLessonConvertSearchParams(buildTrialLessonConvertParams(row));
			params.navigate(`/agreements/new?${searchParams.toString()}`);
		},
		[params.navigate],
	);

	const columns = useMemo(
		() => buildTrialLessonsColumns({ onSetStatus: setStatus, onConvert: convert }),
		[convert, setStatus],
	);

	return {
		rows,
		loading,
		openSchedule,
		setOpenSchedule,
		load,
		columns,
	};
}
