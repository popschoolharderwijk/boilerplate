import { describe, expect, it } from 'bun:test';
import { canAccessTeacherProfile, resolveTargetTeacherUserId } from '../../../src/lib/teachers/teacherInfoHelpers';

describe('resolveTargetTeacherUserId', () => {
	it('returns null while auth is loading', () => {
		expect(
			resolveTargetTeacherUserId({
				routeId: 'teacher-1',
				isTeacher: true,
				teacherUserId: 'teacher-1',
				authLoading: true,
			}),
		).toBeNull();
	});

	it('returns route id when present', () => {
		expect(
			resolveTargetTeacherUserId({
				routeId: 'teacher-1',
				isTeacher: false,
				teacherUserId: null,
				authLoading: false,
			}),
		).toBe('teacher-1');
	});

	it('returns own teacher id when no route id is provided', () => {
		expect(
			resolveTargetTeacherUserId({
				routeId: undefined,
				isTeacher: true,
				teacherUserId: 'teacher-1',
				authLoading: false,
			}),
		).toBe('teacher-1');
	});

	it('returns null when no route or teacher context exists', () => {
		expect(
			resolveTargetTeacherUserId({
				routeId: undefined,
				isTeacher: false,
				teacherUserId: null,
				authLoading: false,
			}),
		).toBeNull();
	});
});

describe('canAccessTeacherProfile', () => {
	it('allows admins to access any teacher profile', () => {
		expect(
			canAccessTeacherProfile({
				targetTeacherUserId: 'teacher-2',
				isAdmin: true,
				isSiteAdmin: false,
				isTeacher: false,
				teacherUserId: null,
			}),
		).toBe(true);
	});

	it('allows site admins to access any teacher profile', () => {
		expect(
			canAccessTeacherProfile({
				targetTeacherUserId: 'teacher-2',
				isAdmin: false,
				isSiteAdmin: true,
				isTeacher: false,
				teacherUserId: null,
			}),
		).toBe(true);
	});

	it('allows teachers to access their own profile', () => {
		expect(
			canAccessTeacherProfile({
				targetTeacherUserId: 'teacher-1',
				isAdmin: false,
				isSiteAdmin: false,
				isTeacher: true,
				teacherUserId: 'teacher-1',
			}),
		).toBe(true);
	});

	it('denies teachers access to other profiles', () => {
		expect(
			canAccessTeacherProfile({
				targetTeacherUserId: 'teacher-2',
				isAdmin: false,
				isSiteAdmin: false,
				isTeacher: true,
				teacherUserId: 'teacher-1',
			}),
		).toBe(false);
	});

	it('denies access when target teacher is missing', () => {
		expect(
			canAccessTeacherProfile({
				targetTeacherUserId: null,
				isAdmin: true,
				isSiteAdmin: true,
				isTeacher: true,
				teacherUserId: 'teacher-1',
			}),
		).toBe(false);
	});
});
