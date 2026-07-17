import type { AppRole } from '@/lib/roles';
import { allRoles } from '@/lib/roles';
import type { User } from '@/types/users';

export interface UserFormState {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	role: AppRole | null;
}

export interface UserFormEditContext {
	user_id: string;
	role: AppRole | null;
}

export type UserFormValidationResult = { ok: true } | { ok: false; message: string; description?: string };

export function assignableRoles(isSiteAdmin: boolean): AppRole[] {
	return allRoles.filter((role) => isSiteAdmin || role !== 'site_admin');
}

export function validateUserFormSubmit(form: UserFormState, isSiteAdmin: boolean): UserFormValidationResult {
	if (!form.email) {
		return { ok: false, message: 'Email is verplicht' };
	}
	if (form.role === 'site_admin' && !isSiteAdmin) {
		return {
			ok: false,
			message: 'Geen toegang',
			description: 'Admins kunnen geen site_admin rollen toewijzen.',
		};
	}
	return { ok: true };
}

export function buildProfileUpdatePayload(form: UserFormState) {
	return {
		email: form.email,
		first_name: form.first_name || null,
		last_name: form.last_name || null,
		phone_number: form.phone_number || null,
	};
}

export function buildCreateUserPayload(form: UserFormState) {
	return {
		email: form.email,
		first_name: form.first_name || undefined,
		last_name: form.last_name || undefined,
		phone_number: form.phone_number || undefined,
		role: form.role || undefined,
	};
}

export function buildCreatedUserInfo(form: UserFormState, data: { user_id: string; email?: string }): User {
	return {
		user_id: data.user_id,
		email: data.email ?? form.email,
		first_name: form.first_name || null,
		last_name: form.last_name || null,
		avatar_url: null,
		phone_number: form.phone_number || null,
	};
}

export function getUserFormDialogCopy(isEditMode: boolean, form: UserFormState) {
	return {
		dialogTitle: isEditMode ? 'Gebruiker bewerken' : 'Nieuwe gebruiker toevoegen',
		dialogDescription: isEditMode
			? `Wijzig de gegevens van ${form.first_name || form.email}.`
			: 'Voeg een nieuwe gebruiker toe aan het systeem.',
		submitLabel: isEditMode ? 'Opslaan' : 'Toevoegen',
		savingLabel: isEditMode ? 'Opslaan...' : 'Toevoegen...',
	};
}

export function parseUserRoleSelectValue(value: string): AppRole | null {
	return value === 'none' ? null : (value as AppRole);
}

export function isUserRoleLocked(
	isEditMode: boolean,
	isAdmin: boolean,
	isSiteAdmin: boolean,
	userRole: AppRole | null | undefined,
): boolean {
	return isEditMode && isAdmin && !isSiteAdmin && userRole === 'site_admin';
}
