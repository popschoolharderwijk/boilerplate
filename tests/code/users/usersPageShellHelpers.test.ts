import { describe, expect, it } from 'bun:test';
import {
	buildUserFormDialogOpenChangeHandler,
	buildUsersDeleteDialogOpenChangeHandler,
	shouldShowUsersPage,
} from '../../../src/lib/users/usersPageShellHelpers';

describe('shouldShowUsersPage', () => {
	it('returns true for admins', () => {
		expect(shouldShowUsersPage(true, false)).toBe(true);
	});

	it('returns true for site admins', () => {
		expect(shouldShowUsersPage(false, true)).toBe(true);
	});

	it('returns false for regular users', () => {
		expect(shouldShowUsersPage(false, false)).toBe(false);
	});
});

describe('buildUserFormDialogOpenChangeHandler', () => {
	it('updates dialog open state', () => {
		let nextOpen = false;
		const handler = buildUserFormDialogOpenChangeHandler({ open: false, user: null }, (value) => {
			nextOpen = value.open;
		});
		handler(true);
		expect(nextOpen).toBe(true);
	});
});

describe('buildUsersDeleteDialogOpenChangeHandler', () => {
	it('clears delete dialog when closed', () => {
		let deleteDialog: { open: boolean; user: { user_id: string } } | null = {
			open: true,
			user: { user_id: 'user-1' },
		};
		const handler = buildUsersDeleteDialogOpenChangeHandler((value) => {
			deleteDialog = value;
		});
		handler(false);
		expect(deleteDialog).toBeNull();
	});
});
