import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { SignupRequestDetail } from '../../../src/components/students/SignupRequestDialog';
import type { LessonAgreementWithTeacher } from '../../../src/types/lesson-agreements';

let profileResult: { data: unknown; error: unknown } = { data: null, error: null };

const mockAgreement: LessonAgreementWithTeacher = {
	id: 'agreement-1',
	day_of_week: 1,
	start_time: '09:00:00',
	start_date: '2026-09-01',
	end_date: null,
	is_active: true,
	notes: null,
	duration_minutes: 45,
	frequency: 'weekly',
	price_per_lesson: 30,
	teacher: { first_name: 'Piet', last_name: 'Docent', avatar_url: null },
	lesson_type: { id: 'lt-1', name: 'Piano', icon: 'piano', color: '#000000' },
};

const mockSignupRequest: SignupRequestDetail = {
	id: 'signup-1',
	first_name: 'Anna',
	last_name: 'Bakker',
	email: 'jan@test.nl',
	phone_number: null,
	parent_name: null,
	parent_email: null,
	parent_phone_number: null,
	date_of_birth: null,
	notes: null,
	status: 'pending',
	created_at: '2026-01-01T00:00:00Z',
	processed_at: null,
	lesson_type_name: 'Piano',
	lesson_group_name: null,
};

const supabaseMock = {
	from: (table: string) => {
		if (table === 'profiles') {
			return {
				select: () => ({
					eq: () => ({
						maybeSingle: () => Promise.resolve(profileResult),
					}),
				}),
			};
		}
		throw new Error(`Unexpected table ${table}`);
	},
};

mock.module('sonner', () => ({
	toast: { error: () => {} },
}));

mock.module('../../../src/lib/students/fetchStudentAgreements', () => ({
	fetchStudentAgreementsForProfile: async () => [mockAgreement],
	fetchStudentAgreementsWithRelations: async () => [mockAgreement],
}));

mock.module('../../../src/lib/signup-requests/signupRequestMappers', () => ({
	fetchSignupRequestsByEmail: async () => [mockSignupRequest],
	fetchSignupRequestsByEmails: async () => new Map(),
}));

describe('runStudentDetailPageLoad', () => {
	let runStudentDetailPageLoad: typeof import('../../../src/lib/students/studentDetailPageLoadHelpers').runStudentDetailPageLoad;

	beforeAll(async () => {
		({ runStudentDetailPageLoad } = await import('../../../src/lib/students/studentDetailPageLoadHelpers'));
	});

	beforeEach(() => {
		profileResult = {
			data: {
				user_id: 'user-1',
				email: 'jan@test.nl',
				first_name: 'Jan',
				last_name: 'Leerling',
				phone_number: null,
				avatar_url: null,
			},
			error: null,
		};
	});

	it('returns profile agreements and signup requests', async () => {
		const result = await runStudentDetailPageLoad(supabaseMock as never, 'user-1');
		expect(result).toEqual({
			profile: {
				user_id: 'user-1',
				email: 'jan@test.nl',
				first_name: 'Jan',
				last_name: 'Leerling',
				phone_number: null,
				avatar_url: null,
			},
			agreements: [mockAgreement],
			signupRequests: [mockSignupRequest],
		});
	});

	it('returns null when profile is missing', async () => {
		profileResult = { data: null, error: null };
		const result = await runStudentDetailPageLoad(supabaseMock as never, 'user-1');
		expect(result).toBeNull();
	});
});
