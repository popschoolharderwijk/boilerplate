import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

let profileResult: { data: unknown; error: unknown } = { data: null, error: null };

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
	fetchStudentAgreementsForProfile: async () => [{ id: 'agreement-1' }],
	fetchStudentAgreementsWithRelations: async () => [{ id: 'agreement-1' }],
}));

mock.module('../../../src/lib/signup-requests/signupRequestMappers', () => ({
	fetchSignupRequestsByEmail: async () => [{ id: 'signup-1' }],
}));

describe('studentDetailPageLoadHelpers', () => {
	let helpers: typeof import('../../../src/lib/students/studentDetailPageLoadHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/students/studentDetailPageLoadHelpers');
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

	it('loadStudentProfileForDetailPage returns profile data on success', async () => {
		const profile = await helpers.loadStudentProfileForDetailPage(supabaseMock as never, 'user-1');
		expect(profile).toEqual({
			user_id: 'user-1',
			email: 'jan@test.nl',
			first_name: 'Jan',
			last_name: 'Leerling',
			phone_number: null,
			avatar_url: null,
		});
	});

	it('loadStudentProfileForDetailPage returns null when profile is missing', async () => {
		profileResult = { data: null, error: null };
		const profile = await helpers.loadStudentProfileForDetailPage(supabaseMock as never, 'user-1');
		expect(profile).toBeNull();
	});

	it('runStudentDetailPageLoad returns profile agreements and signup requests', async () => {
		const result = await helpers.runStudentDetailPageLoad(supabaseMock as never, 'user-1');
		expect(result).not.toBeNull();
		expect(result?.profile.user_id).toBe('user-1');
		expect(result?.agreements).toHaveLength(1);
		expect(result?.signupRequests).toHaveLength(1);
	});

	it('runStudentDetailPageLoad returns null when profile is missing', async () => {
		profileResult = { data: null, error: null };
		const result = await helpers.runStudentDetailPageLoad(supabaseMock as never, 'user-1');
		expect(result).toBeNull();
	});
});
