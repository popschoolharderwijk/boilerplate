import { describe, expect, it } from 'bun:test';
import {
	assignableRoles,
	buildCreatedUserInfo,
	buildCreateUserPayload,
	buildProfileUpdatePayload,
	getUserFormDialogCopy,
	isUserRoleLocked,
	parseUserRoleSelectValue,
	validateUserFormSubmit,
} from '../../../src/lib/users/userFormHelpers';

describe('validateUserFormSubmit', () => {
	it('requires email', () => {
		expect(
			validateUserFormSubmit({ email: '', first_name: '', last_name: '', phone_number: '', role: null }, true),
		).toEqual({ ok: false, message: 'Email is verplicht' });
	});

	it('blocks site_admin assignment for non site admins', () => {
		expect(
			validateUserFormSubmit(
				{
					email: 'admin@example.com',
					first_name: '',
					last_name: '',
					phone_number: '',
					role: 'site_admin',
				},
				false,
			),
		).toEqual({
			ok: false,
			message: 'Geen toegang',
			description: 'Admins kunnen geen site_admin rollen toewijzen.',
		});
	});
});

describe('assignableRoles', () => {
	it('includes site_admin for site admins', () => {
		expect(assignableRoles(true)).toContain('site_admin');
	});

	it('excludes site_admin for regular admins', () => {
		expect(assignableRoles(false)).not.toContain('site_admin');
	});
});

describe('buildProfileUpdatePayload', () => {
	it('maps empty strings to null', () => {
		expect(
			buildProfileUpdatePayload({
				email: 'user@example.com',
				first_name: '',
				last_name: 'Jansen',
				phone_number: '',
				role: null,
			}),
		).toEqual({
			email: 'user@example.com',
			first_name: null,
			last_name: 'Jansen',
			phone_number: null,
		});
	});
});

describe('buildCreateUserPayload', () => {
	it('omits empty optional fields', () => {
		expect(
			buildCreateUserPayload({
				email: 'user@example.com',
				first_name: '',
				last_name: 'Jansen',
				phone_number: '',
				role: 'admin',
			}),
		).toEqual({
			email: 'user@example.com',
			first_name: undefined,
			last_name: 'Jansen',
			phone_number: undefined,
			role: 'admin',
		});
	});
});

describe('buildCreatedUserInfo', () => {
	it('builds created user from response data', () => {
		expect(
			buildCreatedUserInfo(
				{
					email: 'user@example.com',
					first_name: 'Anna',
					last_name: '',
					phone_number: '0612345678',
					role: null,
				},
				{ user_id: 'user-1', email: 'user@example.com' },
			),
		).toEqual({
			user_id: 'user-1',
			email: 'user@example.com',
			first_name: 'Anna',
			last_name: null,
			avatar_url: null,
			phone_number: '0612345678',
		});
	});
});

describe('getUserFormDialogCopy', () => {
	it('returns create mode labels', () => {
		expect(
			getUserFormDialogCopy(false, {
				email: 'user@example.com',
				first_name: '',
				last_name: '',
				phone_number: '',
				role: null,
			}),
		).toEqual({
			dialogTitle: 'Nieuwe gebruiker toevoegen',
			dialogDescription: 'Voeg een nieuwe gebruiker toe aan het systeem.',
			submitLabel: 'Toevoegen',
			savingLabel: 'Toevoegen...',
		});
	});
});

describe('parseUserRoleSelectValue', () => {
	it('returns null for the none option', () => {
		expect(parseUserRoleSelectValue('none')).toBeNull();
	});

	it('returns the selected role', () => {
		expect(parseUserRoleSelectValue('admin')).toBe('admin');
	});
});

describe('isUserRoleLocked', () => {
	it('locks site_admin role for regular admins in edit mode', () => {
		expect(isUserRoleLocked(true, true, false, 'site_admin')).toBe(true);
	});

	it('does not lock roles in create mode', () => {
		expect(isUserRoleLocked(false, true, false, 'site_admin')).toBe(false);
	});
});
