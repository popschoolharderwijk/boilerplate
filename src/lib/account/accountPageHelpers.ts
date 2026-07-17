import { supabase } from '@/integrations/supabase/client';
import type { AccountFormData, AccountFormErrors, AccountProfileState } from '@/lib/account/persistence';
import { validateProfilePhone } from '@/lib/account/persistence';

export function mapLoadedProfileToFormState(profile: AccountProfileState): AccountFormData {
	return {
		first_name: profile.first_name || '',
		last_name: profile.last_name || '',
		phone_number: profile.phone_number || '',
	};
}

export function canConfirmAccountDelete(confirmEmail: string, userEmail: string | undefined): boolean {
	return confirmEmail === userEmail;
}

export async function loadAccountProfile(userId: string): Promise<AccountProfileState | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select('first_name, last_name, phone_number, avatar_url')
		.eq('user_id', userId)
		.single();

	if (error) {
		console.error('Error loading profile:', error);
		return null;
	}

	return data;
}

export function applyAccountPhoneFieldChange(
	formData: AccountFormData,
	errors: AccountFormErrors,
	phoneNumber: string,
): { formData: AccountFormData; errors: AccountFormErrors } {
	const phoneErrors = validateProfilePhone(phoneNumber);
	return {
		formData: { ...formData, phone_number: phoneNumber },
		errors: {
			...errors,
			phone_number: phoneErrors.phone_number,
		},
	};
}
