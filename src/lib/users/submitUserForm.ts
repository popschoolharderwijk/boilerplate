import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getInvokeErrorMessage } from '@/lib/auth/invokeError';
import type { AppRole } from '@/lib/roles';
import { resolveUserRoleUpdateAction } from '@/lib/users/submitUserFormHelpers';
import {
	buildCreatedUserInfo,
	buildCreateUserPayload,
	buildProfileUpdatePayload,
	type UserFormEditContext,
	type UserFormState,
	validateUserFormSubmit,
} from '@/lib/users/userFormHelpers';
import type { User } from '@/types/users';

export type SubmitUserFormResult =
	| { ok: true; mode: 'edit' }
	| { ok: true; mode: 'create'; createdUser: User }
	| { ok: false };

async function updateUserRole(userId: string, newRole: AppRole | null, currentRole: AppRole | null): Promise<boolean> {
	const action = resolveUserRoleUpdateAction(newRole, currentRole);
	if (action === 'skip') return true;

	if (action === 'delete') {
		const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
		if (error) {
			toast.error('Fout bij bijwerken rol', { description: error.message });
			return false;
		}
		return true;
	}

	if (action === 'insert' && newRole) {
		const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
		if (error) {
			toast.error('Fout bij toewijzen rol', { description: error.message });
			return false;
		}
		return true;
	}

	if (action === 'update' && newRole) {
		const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
		if (error) {
			toast.error('Fout bij bijwerken rol', { description: error.message });
			return false;
		}
		return true;
	}

	return true;
}

async function submitUserEdit(form: UserFormState, user: UserFormEditContext): Promise<SubmitUserFormResult> {
	const { error: profileError } = await supabase
		.from('profiles')
		.update(buildProfileUpdatePayload(form))
		.eq('user_id', user.user_id);

	if (profileError) {
		toast.error('Fout bij bijwerken gebruiker', { description: profileError.message });
		return { ok: false };
	}

	const roleOk = await updateUserRole(user.user_id, form.role, user.role);
	if (!roleOk) return { ok: false };

	toast.success('Gebruiker bijgewerkt');
	return { ok: true, mode: 'edit' };
}

async function submitUserCreate(form: UserFormState, isSiteAdmin: boolean): Promise<SubmitUserFormResult> {
	const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
		body: buildCreateUserPayload(form),
	});

	if (invokeError) {
		const errorMessage = await getInvokeErrorMessage(invokeError, { isSiteAdmin });
		toast.error('Fout bij aanmaken gebruiker', { description: errorMessage });
		return { ok: false };
	}

	if (data?.error) {
		toast.error('Fout bij aanmaken gebruiker', { description: data.error });
		return { ok: false };
	}

	if (data?.warning) {
		toast.warning('Gebruiker aangemaakt', { description: data.warning });
	} else {
		toast.success('Gebruiker aangemaakt', {
			description: `Gebruiker ${form.email} is succesvol aangemaakt.`,
		});
	}

	return { ok: true, mode: 'create', createdUser: buildCreatedUserInfo(form, data) };
}

export async function submitUserForm(
	form: UserFormState,
	isSiteAdmin: boolean,
	editContext: UserFormEditContext | null,
): Promise<SubmitUserFormResult> {
	const validation = validateUserFormSubmit(form, isSiteAdmin);
	if (validation.ok === false) {
		toast.error(validation.message, validation.description ? { description: validation.description } : undefined);
		return { ok: false };
	}

	if (editContext) {
		return submitUserEdit(form, editContext);
	}

	return submitUserCreate(form, isSiteAdmin);
}
