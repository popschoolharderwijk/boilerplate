import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { TeacherStatistics, TeacherStatisticsAgreement } from '@/lib/statistics/myStatisticsHelpers';
import { executeLoadMyStatistics, shouldLoadMyStatistics } from '@/lib/statistics/myStatisticsPageHelpers';

interface UseMyStatisticsPageParams {
	authLoading: boolean;
	isTeacher: boolean;
	teacherUserId: string | null | undefined;
}

export function useMyStatisticsPage(params: UseMyStatisticsPageParams) {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<TeacherStatistics>({
		studentCount: 0,
		lessonsPerWeek: 0,
		groupLessons: 0,
		upcomingLessons: 0,
	});

	const queryAgreements = useCallback(async (teacherUserId: string) => {
		return supabase
			.from('lesson_agreements')
			.select('student_user_id, lesson_type_id, is_active, lesson_types!inner(is_group_lesson)')
			.eq('teacher_user_id', teacherUserId)
			.eq('is_active', true);
	}, []);

	const loadStatistics = useCallback(async () => {
		setLoading(true);
		const outcome = await executeLoadMyStatistics({
			isTeacher: params.isTeacher,
			teacherUserId: params.teacherUserId,
			queryAgreements: async (teacherUserId) => {
				const result = await queryAgreements(teacherUserId);
				return {
					data: (result.data ?? []) as TeacherStatisticsAgreement[],
					error: result.error,
				};
			},
		});

		if (outcome.kind === 'skipped') {
			setLoading(false);
			return;
		}

		if (outcome.kind === 'error') {
			toast.error('Fout bij laden statistieken');
			setLoading(false);
			return;
		}

		setStats(outcome.stats);
		setLoading(false);
	}, [params.isTeacher, params.teacherUserId, queryAgreements]);

	useEffect(() => {
		if (shouldLoadMyStatistics(params.authLoading, params.isTeacher)) {
			void loadStatistics();
		}
	}, [params.authLoading, params.isTeacher, loadStatistics]);

	return { loading, stats };
}
