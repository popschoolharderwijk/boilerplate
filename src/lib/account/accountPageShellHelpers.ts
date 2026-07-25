import type { AccountFormData, AccountFormErrors, AccountProfileState } from '@/lib/account/persistence';

export interface AccountPageViewModel {
	user: { id: string; email?: string | null } | null;
	loading: boolean;
	saving: boolean;
	profile: AccountProfileState | null;
	formData: AccountFormData;
	errors: AccountFormErrors;
	deleteDialogOpen: boolean;
	deleteConfirmEmail: string;
	deleting: boolean;
	userInitials: string;
}

export function buildAccountPageViewModel(params: {
	user: { id: string; email?: string | null } | null;
	loading: boolean;
	saving: boolean;
	profile: AccountProfileState | null;
	formData: AccountFormData;
	errors: AccountFormErrors;
	deleteDialogOpen: boolean;
	deleteConfirmEmail: string;
	deleting: boolean;
	userInitials: string;
}): AccountPageViewModel {
	return {
		user: params.user,
		loading: params.loading,
		saving: params.saving,
		profile: params.profile,
		formData: params.formData,
		errors: params.errors,
		deleteDialogOpen: params.deleteDialogOpen,
		deleteConfirmEmail: params.deleteConfirmEmail,
		deleting: params.deleting,
		userInitials: params.userInitials,
	};
}

export function resetAccountDeleteDialogState(): { deleteDialogOpen: false; deleteConfirmEmail: '' } {
	return { deleteDialogOpen: false, deleteConfirmEmail: '' };
}
