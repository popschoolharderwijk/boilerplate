import { describe, expect, it } from 'bun:test';
import {
	buildStudentAvatarFallback,
	buildStudentInitials,
	formatStudentPhoneSubtitle,
	resolveStudentDetailPageContent,
} from '../../../src/lib/students/studentDetailHelpers';

describe('buildStudentInitials', () => {
	it('combines first letters of names', () => {
		expect(
			buildStudentInitials({
				user_id: 'u-1',
				email: 'jan@test.nl',
				first_name: 'Jan',
				last_name: 'Leerling',
				phone_number: null,
				avatar_url: null,
			}),
		).toBe('JL');
	});
});

describe('buildStudentAvatarFallback', () => {
	it('uses email prefix when initials are empty', () => {
		expect(
			buildStudentAvatarFallback(
				{
					user_id: 'u-1',
					email: 'jan@test.nl',
					first_name: null,
					last_name: null,
					phone_number: null,
					avatar_url: null,
				},
				'',
			),
		).toBe('JA');
	});
});

describe('formatStudentPhoneSubtitle', () => {
	it('includes phone number when available', () => {
		expect(formatStudentPhoneSubtitle('jan@test.nl', '0612345678')).toBe('jan@test.nl · 0612345678');
	});
});

describe('resolveStudentDetailPageContent', () => {
	const profile = {
		user_id: 'u-1',
		email: 'jan@test.nl',
		first_name: 'Jan',
		last_name: 'Leerling',
		phone_number: null,
		avatar_url: null,
	};

	it('returns loading content while auth is loading', () => {
		expect(
			resolveStudentDetailPageContent({
				authLoading: true,
				canView: true,
				loading: false,
				profile: null,
				userId: 'u-1',
				agreements: [],
				signupRequests: [],
			}),
		).toEqual({ kind: 'loading' });
	});

	it('returns loading content while page data is loading', () => {
		expect(
			resolveStudentDetailPageContent({
				authLoading: false,
				canView: true,
				loading: true,
				profile: null,
				userId: 'u-1',
				agreements: [],
				signupRequests: [],
			}),
		).toEqual({ kind: 'loading' });
	});

	it('returns body content when profile is available', () => {
		expect(
			resolveStudentDetailPageContent({
				authLoading: false,
				canView: true,
				loading: false,
				profile,
				userId: 'u-1',
				agreements: [],
				signupRequests: [],
			}),
		).toEqual({
			kind: 'body',
			profile,
			userId: 'u-1',
			agreements: [],
			signupRequests: [],
		});
	});

	it('returns home redirect when user cannot view student detail', () => {
		expect(
			resolveStudentDetailPageContent({
				authLoading: false,
				canView: false,
				loading: false,
				profile: null,
				userId: 'u-1',
				agreements: [],
				signupRequests: [],
			}),
		).toEqual({ kind: 'redirect', to: '/' });
	});

	it('returns students redirect when profile is missing', () => {
		expect(
			resolveStudentDetailPageContent({
				authLoading: false,
				canView: true,
				loading: false,
				profile: null,
				userId: 'u-1',
				agreements: [],
				signupRequests: [],
			}),
		).toEqual({ kind: 'redirect', to: '/students' });
	});
});
