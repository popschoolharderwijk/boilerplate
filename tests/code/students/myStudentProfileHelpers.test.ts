import { describe, expect, it } from 'bun:test';
import {
	hasParentContactInfo,
	resolveMyStudentProfileView,
	shouldRedirectMissingStudentProfile,
} from '../../../src/lib/students/myStudentProfileHelpers';

describe('hasParentContactInfo', () => {
	it('returns true when any parent field is present', () => {
		expect(
			hasParentContactInfo({
				parent_name: 'Parent',
				parent_email: null,
				parent_phone_number: null,
			}),
		).toBe(true);
	});

	it('returns false when all parent fields are empty', () => {
		expect(
			hasParentContactInfo({
				parent_name: null,
				parent_email: null,
				parent_phone_number: null,
			}),
		).toBe(false);
	});
});

describe('shouldRedirectMissingStudentProfile', () => {
	it('redirects authenticated users without a student profile after loading', () => {
		expect(
			shouldRedirectMissingStudentProfile({
				authLoading: false,
				user: { id: 'user-1' },
				profileLoaded: false,
				loading: false,
			}),
		).toBe(true);
	});

	it('does not redirect while loading', () => {
		expect(
			shouldRedirectMissingStudentProfile({
				authLoading: false,
				user: { id: 'user-1' },
				profileLoaded: false,
				loading: true,
			}),
		).toBe(false);
	});
});

describe('resolveMyStudentProfileView', () => {
	it('returns redirect-missing when student profile is absent', () => {
		expect(
			resolveMyStudentProfileView({
				authLoading: false,
				loading: false,
				profile: null,
				redirectMissing: true,
			}),
		).toBe('redirect-missing');
	});

	it('returns skeleton while loading', () => {
		expect(
			resolveMyStudentProfileView({
				authLoading: false,
				loading: true,
				profile: null,
				redirectMissing: false,
			}),
		).toBe('skeleton');
	});

	it('returns content when profile is loaded', () => {
		expect(
			resolveMyStudentProfileView({
				authLoading: false,
				loading: false,
				profile: { id: 'student-1' },
				redirectMissing: false,
			}),
		).toBe('content');
	});
});
