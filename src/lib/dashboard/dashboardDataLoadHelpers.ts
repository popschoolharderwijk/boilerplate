import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardDataLoadResult } from '@/lib/dashboard/dashboardDataHelpers';
import {
	assembleDashboardDataLoadResult,
	fetchDashboardCoreQueryResults,
	fetchDashboardTeacherRows,
} from '@/lib/dashboard/dashboardDataLoadQueryHelpers';

export function shouldLoadDashboardData(isPrivileged: boolean): boolean {
	return isPrivileged;
}

export function extractTeacherUserIds(rows: { user_id: string }[]): string[] {
	return rows.map((row) => row.user_id);
}

export function shouldLoadDashboardTeachers(teacherUserIds: string[]): boolean {
	return teacherUserIds.length > 0;
}

export type { DashboardDataLoadResult } from '@/lib/dashboard/dashboardDataHelpers';

export async function fetchDashboardData(
	supabase: SupabaseClient,
	isPrivileged: boolean,
): Promise<DashboardDataLoadResult | null> {
	if (!shouldLoadDashboardData(isPrivileged)) return null;

	const core = await fetchDashboardCoreQueryResults(supabase);
	if (!shouldLoadDashboardTeachers(core.teacherUserIds)) {
		return assembleDashboardDataLoadResult(core, null);
	}

	const teacherRows = await fetchDashboardTeacherRows(supabase, core.teacherUserIds);
	return assembleDashboardDataLoadResult(core, teacherRows);
}
