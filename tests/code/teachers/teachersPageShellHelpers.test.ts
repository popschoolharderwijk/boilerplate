import { describe, expect, it } from 'bun:test';
import {
	buildTeacherFormDialogOpenChangeHandler,
	shouldShowTeachersPage,
} from '../../../src/lib/teachers/teachersPageShellHelpers';

describe('shouldShowTeachersPage', () => {
	it('returns true for admins', () => {
		expect(shouldShowTeachersPage(true, false)).toBe(true);
	});

	it('returns true for site admins', () => {
		expect(shouldShowTeachersPage(false, true)).toBe(true);
	});

	it('returns false for regular users', () => {
		expect(shouldShowTeachersPage(false, false)).toBe(false);
	});
});

describe('buildTeacherFormDialogOpenChangeHandler', () => {
	it('updates dialog open state while preserving teacher', () => {
		let next: { open: boolean; teacher: { user_id: string } | null } = { open: false, teacher: null };
		const handler = buildTeacherFormDialogOpenChangeHandler(null, (value) => {
			next = value;
		});
		handler(true);
		expect(next.open).toBe(true);
	});
});
