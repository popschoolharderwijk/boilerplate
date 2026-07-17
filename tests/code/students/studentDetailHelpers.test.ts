import { describe, expect, it } from 'bun:test';
import {
	buildStudentAvatarFallback,
	buildStudentInitials,
	formatStudentPhoneSubtitle,
	resolveStudentDetailPageContent,
	resolveStudentDetailRedirectPath,
	resolveStudentDetailRenderTarget,
	resolveStudentDetailViewState,
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

describe('resolveStudentDetailViewState', () => {
	it('returns redirect when user cannot view student detail', () => {
		expect(resolveStudentDetailViewState(false, false, false, false)).toBe('redirect');
	});

	it('returns loading while auth or page data is loading', () => {
		expect(resolveStudentDetailViewState(true, true, false, false)).toBe('loading');
		expect(resolveStudentDetailViewState(false, true, true, false)).toBe('loading');
	});

	it('returns not-found when profile is missing', () => {
		expect(resolveStudentDetailViewState(false, true, false, false)).toBe('not-found');
	});

	it('returns content when profile is available', () => {
		expect(resolveStudentDetailViewState(false, true, false, true)).toBe('content');
	});
});

describe('resolveStudentDetailRedirectPath', () => {
	it('returns home redirect for unauthorized users', () => {
		expect(resolveStudentDetailRedirectPath('redirect')).toBe('/');
	});

	it('returns students redirect for missing profiles', () => {
		expect(resolveStudentDetailRedirectPath('not-found')).toBe('/students');
	});

	it('returns null for loading and content states', () => {
		expect(resolveStudentDetailRedirectPath('loading')).toBeNull();
		expect(resolveStudentDetailRedirectPath('content')).toBeNull();
	});
});

describe('resolveStudentDetailRenderTarget', () => {
	it('returns loading target while page is loading', () => {
		expect(resolveStudentDetailRenderTarget('loading', false)).toBe('loading');
	});

	it('returns content target when profile is available', () => {
		expect(resolveStudentDetailRenderTarget('content', true)).toBe('content');
	});

	it('returns students redirect when profile is missing in content state', () => {
		expect(resolveStudentDetailRenderTarget('content', false)).toBe('/students');
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
});
