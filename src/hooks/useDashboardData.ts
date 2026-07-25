import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardStats, DashboardStudent, DashboardTeacher } from '@/lib/dashboard/dashboardDataHelpers';
import { fetchDashboardData } from '@/lib/dashboard/dashboardDataLoadHelpers';

export type { DashboardStats, DashboardStudent, DashboardTeacher };

export function useDashboardData() {
	const { isLoading: authLoading, isPrivileged } = useAuth();
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [recentStudents, setRecentStudents] = useState<DashboardStudent[]>([]);
	const [teachers, setTeachers] = useState<DashboardTeacher[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await fetchDashboardData(supabase, isPrivileged);
			if (!result) {
				setIsLoading(false);
				return;
			}
			setStats(result.stats);
			setRecentStudents(result.recentStudents);
			setTeachers(result.teachers);
		} catch (err) {
			console.error('Error loading dashboard data:', err);
		} finally {
			setIsLoading(false);
		}
	}, [isPrivileged]);

	useEffect(() => {
		if (!authLoading) {
			void loadData();
		}
	}, [authLoading, loadData]);

	return { stats, recentStudents, teachers, isLoading: isLoading || authLoading };
}
