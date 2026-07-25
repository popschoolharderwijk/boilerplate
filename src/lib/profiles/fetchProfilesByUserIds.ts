import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/users';

const PROFILE_SELECT = 'user_id, first_name, last_name, email, avatar_url, phone_number' as const;

/** Load profile rows for a set of user IDs (user select components). */
export async function fetchProfilesByUserIds(userIds: string[]): Promise<User[] | null> {
	if (userIds.length === 0) {
		return [];
	}

	const { data: profilesData, error: profilesError } = await supabase
		.from('profiles')
		.select(PROFILE_SELECT)
		.in('user_id', userIds)
		.order('first_name');

	if (profilesError) {
		toast.error('Fout bij laden gebruikers', { description: profilesError.message });
		return null;
	}

	return profilesData ?? [];
}
