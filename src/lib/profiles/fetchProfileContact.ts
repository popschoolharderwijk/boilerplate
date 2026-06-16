import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type ProfileContactFields = {
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
};

/** Load profile contact fields for an existing user (form dialogs). */
export async function fetchProfileContactByUserId(userId: string): Promise<ProfileContactFields | null> {
	const { data: profile, error } = await supabase
		.from('profiles')
		.select('email, first_name, last_name, phone_number')
		.eq('user_id', userId)
		.single();

	if (error) {
		console.error('Error loading user data:', error);
		toast.error('Fout bij laden gebruikersgegevens');
		return null;
	}

	return profile;
}
