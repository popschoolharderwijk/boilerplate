import { toast } from 'sonner';
import {
	type FetchTeachersPaginatedParams,
	type FetchTeachersPaginatedResult,
	fetchTeachersPaginated,
} from '@/lib/teachers/teachersPageHelpers';

export type TeachersPageLoadOutcome =
	| { kind: 'skipped' }
	| { kind: 'success'; result: FetchTeachersPaginatedResult }
	| { kind: 'error' };

export interface ExecuteTeachersPageLoadParams extends FetchTeachersPaginatedParams {
	hasAccess: boolean;
}

export async function executeTeachersPageLoad(params: ExecuteTeachersPageLoadParams): Promise<TeachersPageLoadOutcome> {
	if (!params.hasAccess) return { kind: 'skipped' };

	try {
		const result = await fetchTeachersPaginated({
			limit: params.limit,
			offset: params.offset,
			search: params.search,
			status: params.status,
			lessonTypeId: params.lessonTypeId,
			sortColumn: params.sortColumn,
			sortDirection: params.sortDirection,
		});

		if (result.error) {
			console.error('Error loading teachers:', result.error);
			toast.error('Fout bij laden docenten');
			return { kind: 'error' };
		}

		return { kind: 'success', result };
	} catch (loadError) {
		console.error('Error loading teachers:', loadError);
		toast.error('Fout bij laden docenten');
		return { kind: 'error' };
	}
}

export function applyTeachersPageLoadOutcome(
	outcome: TeachersPageLoadOutcome,
	setTeachers: (teachers: FetchTeachersPaginatedResult['teachers']) => void,
	setTotalCount: (count: number) => void,
): boolean {
	if (outcome.kind === 'success') {
		setTeachers(outcome.result.teachers);
		setTotalCount(outcome.result.totalCount);
	}
	return outcome.kind !== 'skipped';
}
