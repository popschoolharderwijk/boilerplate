import { describe, expect, it } from 'bun:test';
import {
	buildUserFormDialogOpenChangeHandler,
	buildUsersDeleteDialogOpenChangeHandler,
	buildUsersPageShellState,
} from '../../../src/lib/users/usersPageShellHelpers';

describe('buildUsersPageShellState', () => {
	it('grants access to admins and normalizes missing role filter to null', () => {
		expect(
			buildUsersPageShellState({
				isAdmin: true,
				isSiteAdmin: false,
				userId: 'user-1',
				selectedRoleFilter: undefined,
			}),
		).toEqual({
			hasAccess: true,
			selectedRole: null,
			userId: 'user-1',
			isAdmin: true,
			isSiteAdmin: false,
		});
	});

	it('denies access for regular users and keeps an explicit role filter', () => {
		expect(
			buildUsersPageShellState({
				isAdmin: false,
				isSiteAdmin: false,
				userId: undefined,
				selectedRoleFilter: 'staff',
			}),
		).toEqual({
			hasAccess: false,
			selectedRole: 'staff',
			userId: undefined,
			isAdmin: false,
			isSiteAdmin: false,
		});
	});

	it('grants access to site admins', () => {
		expect(
			buildUsersPageShellState({
				isAdmin: false,
				isSiteAdmin: true,
				userId: 'site-admin-1',
				selectedRoleFilter: 'none',
			}).hasAccess,
		).toBe(true);
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
