import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
	type AgreementsPageLoadOutcome,
	applyAgreementsPageLoadOutcome,
	collectAgreementProfileUserIds,
	resolveAgreementSortUsesClientSideProfile,
} from '../../../src/lib/agreements/agreementsPageLoadHelpers';
import type { RawAgreementRow } from '../../../src/lib/agreements/mapAgreementTableRow';

let agreementsResult: { data: unknown; error: { message: string } | null; count: number | null } = {
	data: [],
	error: null,
	count: 0,
};
let profilesResult: { data: unknown; error: { message: string } | null } = {
	data: [],
	error: null,
};

const createAgreementsQuery = () => {
	const query = Object.assign(Promise.resolve(agreementsResult), {
		eq: () => query,
		order: () => query,
	});
	return query;
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
	},
}));

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: (table: string) => ({
			select: () => {
				if (table === 'lesson_agreements') {
					return createAgreementsQuery();
				}
				return {
					in: () => Promise.resolve(profilesResult),
				};
			},
		}),
	},
}));

const rawAgreement: RawAgreementRow = {
	id: 'agreement-1',
	created_at: '2026-01-01T00:00:00Z',
	day_of_week: 1,
	start_time: '14:00:00',
	start_date: '2026-01-01',
	end_date: null,
	is_active: true,
	notes: null,
	student_user_id: 'student-1',
	teacher_user_id: 'teacher-1',
	lesson_type_id: 'lesson-1',
	duration_minutes: 60,
	frequency: 'weekly',
	price_per_lesson: 2500,
	duo_pair_id: null,
	lesson_types: { id: 'lesson-1', name: 'Piano', icon: 'piano', color: '#000000' },
	teachers: { user_id: 'teacher-1' },
};

describe('resolveAgreementSortUsesClientSideProfile', () => {
	it('returns true for student and teacher sort columns', () => {
		expect(resolveAgreementSortUsesClientSideProfile('student')).toBe(true);
		expect(resolveAgreementSortUsesClientSideProfile('teacher')).toBe(true);
	});

	it('returns false for database sort columns', () => {
		expect(resolveAgreementSortUsesClientSideProfile('created_at')).toBe(false);
	});
});

describe('collectAgreementProfileUserIds', () => {
	it('collects unique student and teacher user ids', () => {
		expect(
			collectAgreementProfileUserIds([
				rawAgreement,
				{ ...rawAgreement, id: 'agreement-2', student_user_id: 'student-2' },
			]),
		).toEqual(['student-1', 'student-2', 'teacher-1']);
	});
});

describe('applyAgreementsPageLoadOutcome', () => {
	it('applies success outcome and returns true', () => {
		let agreementCount = -1;
		let totalCount = -1;
		const outcome: AgreementsPageLoadOutcome = {
			kind: 'success',
			agreements: [],
			totalCount: 4,
		};
		const shouldStopLoading = applyAgreementsPageLoadOutcome(
			outcome,
			(value) => {
				agreementCount = value.length;
			},
			(value) => {
				totalCount = value;
			},
		);
		expect(shouldStopLoading).toBe(true);
		expect(agreementCount).toBe(0);
		expect(totalCount).toBe(4);
	});

	it('returns false for skipped outcome', () => {
		expect(
			applyAgreementsPageLoadOutcome(
				{ kind: 'skipped' },
				() => {},
				() => {},
			),
		).toBe(false);
	});
});

describe('executeAgreementsPageLoad', () => {
	let executeAgreementsPageLoad: typeof import('../../../src/lib/agreements/agreementsPageLoadHelpers').executeAgreementsPageLoad;

	beforeAll(async () => {
		({ executeAgreementsPageLoad } = await import('../../../src/lib/agreements/agreementsPageLoadHelpers'));
	});

	beforeEach(() => {
		agreementsResult = { data: [rawAgreement], error: null, count: 1 };
		profilesResult = {
			data: [
				{
					user_id: 'student-1',
					first_name: 'Anna',
					last_name: 'Leerling',
					avatar_url: null,
					email: 'anna@example.com',
				},
				{
					user_id: 'teacher-1',
					first_name: 'Piet',
					last_name: 'Docent',
					avatar_url: null,
					email: 'piet@example.com',
				},
			],
			error: null,
		};
	});

	it('returns skipped when auth is still loading', async () => {
		expect(
			await executeAgreementsPageLoad({
				authLoading: true,
				hasAccess: true,
				statusFilter: null,
				selectedLessonTypeId: null,
				debouncedSearchQuery: '',
				sortColumn: null,
				sortDirection: null,
				currentPage: 1,
				rowsPerPage: 10,
			}),
		).toEqual({ kind: 'skipped' });
	});

	it('returns success with one agreement row', async () => {
		const outcome = await executeAgreementsPageLoad({
			authLoading: false,
			hasAccess: true,
			statusFilter: null,
			selectedLessonTypeId: null,
			debouncedSearchQuery: '',
			sortColumn: null,
			sortDirection: null,
			currentPage: 1,
			rowsPerPage: 10,
		});
		expect(outcome).toEqual({
			kind: 'success',
			agreements: [
				expect.objectContaining({
					id: 'agreement-1',
					student_user_id: 'student-1',
					teacher_user_id: 'teacher-1',
				}),
			],
			totalCount: 1,
		});
	});
});
