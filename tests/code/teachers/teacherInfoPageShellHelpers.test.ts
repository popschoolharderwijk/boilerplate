import { describe, expect, it } from 'bun:test';
import {
	resolveTeacherInfoPageGate,
	shouldRedirectTeacherInfo,
	shouldShowTeacherInfoSkeleton,
} from '../../../src/lib/teachers/teacherInfoPageShellHelpers';

describe('shouldRedirectTeacherInfo', () => {
	it('returns true when access is denied', () => {
		expect(shouldRedirectTeacherInfo('denied')).toBe(true);
	});

	it('returns false for other gates', () => {
		expect(shouldRedirectTeacherInfo('ready')).toBe(false);
	});
});

describe('shouldShowTeacherInfoSkeleton', () => {
	it('returns true while auth or profile is loading', () => {
		expect(shouldShowTeacherInfoSkeleton('loading', null, 'teacher-1')).toBe(true);
		expect(shouldShowTeacherInfoSkeleton('profile-loading', null, 'teacher-1')).toBe(true);
	});

	it('returns true when profile or user id is missing after loading', () => {
		expect(shouldShowTeacherInfoSkeleton('ready', null, 'teacher-1')).toBe(true);
		expect(shouldShowTeacherInfoSkeleton('ready', {}, null)).toBe(true);
	});

	it('returns false when profile and user id are available', () => {
		expect(shouldShowTeacherInfoSkeleton('ready', { id: 'teacher-1' }, 'teacher-1')).toBe(false);
	});
});

describe('resolveTeacherInfoPageGate', () => {
	it('returns loading while auth is loading', () => {
		expect(
			resolveTeacherInfoPageGate({
				authLoading: true,
				targetTeacherUserId: 'teacher-1',
				canAccess: true,
				loading: false,
				hasProfile: false,
			}),
		).toBe('loading');
	});

	it('returns denied when user lacks access', () => {
		expect(
			resolveTeacherInfoPageGate({
				authLoading: false,
				targetTeacherUserId: 'teacher-1',
				canAccess: false,
				loading: false,
				hasProfile: false,
			}),
		).toBe('denied');
	});

	it('returns profile-loading while profile loads', () => {
		expect(
			resolveTeacherInfoPageGate({
				authLoading: false,
				targetTeacherUserId: 'teacher-1',
				canAccess: true,
				loading: true,
				hasProfile: false,
			}),
		).toBe('profile-loading');
	});

	it('returns ready when profile is available', () => {
		expect(
			resolveTeacherInfoPageGate({
				authLoading: false,
				targetTeacherUserId: 'teacher-1',
				canAccess: true,
				loading: false,
				hasProfile: true,
			}),
		).toBe('ready');
	});
});
