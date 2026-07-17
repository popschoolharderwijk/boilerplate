import type { User } from '@supabase/supabase-js';
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { resolveDeleteAccountToastKind, runSaveProfile, runUploadAvatar } from '@/lib/account/accountActionsHelpers';
import {
	type AccountFormData,
	type AccountFormErrors,
	type AccountProfileState,
	dispatchProfileUpdated,
	persistAccountDelete,
	persistAvatarDelete,
} from '@/lib/account/persistence';

interface UseAccountActionsParams {
	user: User | null;
	profile: AccountProfileState | null;
	formData: AccountFormData;
	setProfile: Dispatch<SetStateAction<AccountProfileState | null>>;
	setSaving: Dispatch<SetStateAction<boolean>>;
	setDeleting: Dispatch<SetStateAction<boolean>>;
	setErrors: Dispatch<SetStateAction<AccountFormErrors>>;
	navigate: NavigateFunction;
}

function showDeleteAccountError(error: string, code?: string): void {
	const toastKind = resolveDeleteAccountToastKind(error, code);
	if (toastKind === 'last-site-admin') {
		toast.error('Kan account niet verwijderen', { description: error });
		return;
	}
	if (toastKind === 'session-expired') {
		toast.error('Sessie verlopen', { description: 'Log opnieuw in en probeer het nogmaals.' });
		return;
	}
	toast.error('Fout bij verwijderen account', { description: error });
}

export function useAccountActions({
	user,
	profile,
	formData,
	setProfile,
	setSaving,
	setDeleting,
	setErrors,
	navigate,
}: UseAccountActionsParams) {
	const handleSaveProfile = (event: FormEvent) => {
		if (!user) return;
		event.preventDefault();
		return runSaveProfile({ userId: user.id, formData, profile, setErrors, setSaving, setProfile });
	};

	const handleUploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
		if (!user) return;
		return runUploadAvatar({ userId: user.id, event, profile, setSaving, setProfile });
	};

	const handleDeleteAvatar = async () => {
		if (!user) return;

		setSaving(true);
		const { error } = await persistAvatarDelete(user.id);
		if (error) {
			toast.error('Fout bij verwijderen avatar', { description: error });
		} else if (profile) {
			setProfile({ ...profile, avatar_url: null });
			toast.success('Avatar verwijderd!');
			dispatchProfileUpdated();
		}
		setSaving(false);
	};

	const handleDeleteAccount = async () => {
		setDeleting(true);
		try {
			const { error, code } = await persistAccountDelete();
			if (error) {
				showDeleteAccountError(error, code);
				setDeleting(false);
				return;
			}
			toast.success('Account verwijderd', {
				description: 'Je account en alle bijbehorende gegevens zijn verwijderd.',
			});
			await supabase.auth.signOut();
			navigate('/login');
		} catch (error) {
			console.error('Error deleting account:', error);
			toast.error('Fout bij verwijderen account', {
				description: 'Er is een netwerkfout opgetreden. Probeer het later opnieuw.',
			});
			setDeleting(false);
		}
	};

	return {
		handleSaveProfile,
		handleUploadAvatar,
		handleDeleteAvatar,
		handleDeleteAccount,
	};
}
