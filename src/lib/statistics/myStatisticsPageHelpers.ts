import type { TeacherStatistics, TeacherStatisticsAgreement } from '@/lib/statistics/myStatisticsHelpers';
import { computeTeacherStatistics } from '@/lib/statistics/myStatisticsHelpers';

export function shouldLoadMyStatistics(authLoading: boolean, isTeacher: boolean): boolean {
	return !authLoading && isTeacher;
}

function shouldRunStatisticsQuery(isTeacher: boolean, teacherUserId: string | null | undefined): boolean {
	return isTeacher && Boolean(teacherUserId);
}

export type MyStatisticsLoadOutcome = { kind: 'error' } | { kind: 'success'; stats: TeacherStatistics };

function resolveMyStatisticsLoadOutcome(
	agreementsError: { message?: string } | null,
	agreements: TeacherStatisticsAgreement[] | null,
): MyStatisticsLoadOutcome {
	if (agreementsError) {
		return { kind: 'error' };
	}
	return { kind: 'success', stats: computeTeacherStatistics(agreements ?? []) };
}

export function shouldRedirectMyStatistics(authLoading: boolean, isTeacher: boolean): boolean {
	return !authLoading && !isTeacher;
}

export function shouldShowMyStatisticsSkeleton(authLoading: boolean, loading: boolean): boolean {
	return authLoading || loading;
}

export interface ExecuteLoadMyStatisticsParams {
	isTeacher: boolean;
	teacherUserId: string | null | undefined;
	queryAgreements: (teacherUserId: string) => Promise<{
		data: TeacherStatisticsAgreement[] | null;
		error: { message?: string } | null;
	}>;
}

export async function executeLoadMyStatistics(
	params: ExecuteLoadMyStatisticsParams,
): Promise<MyStatisticsLoadOutcome | { kind: 'skipped' }> {
	if (!shouldRunStatisticsQuery(params.isTeacher, params.teacherUserId)) {
		return { kind: 'skipped' };
	}

	const { data, error } = await params.queryAgreements(params.teacherUserId ?? '');
	return resolveMyStatisticsLoadOutcome(error, data);
}
