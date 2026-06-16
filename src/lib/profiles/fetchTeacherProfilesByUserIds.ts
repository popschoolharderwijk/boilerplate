import { supabase } from '@/integrations/supabase/client';
import { indexByUserId } from '@/lib/collections';
import type { User } from '@/types/users';

type TeacherProfileSlice = Pick<User, 'user_id' | 'first_name' | 'last_name' | 'avatar_url'>;

export async function fetchTeacherProfilesByUserIds(userIds: string[]): Promise<Map<string, TeacherProfileSlice>> {
	if (userIds.length === 0) {
		return new Map();
	}

	const { data, error } = await supabase
		.from('profiles')
		.select('user_id, first_name, last_name, avatar_url')
		.in('user_id', userIds);

	if (error) {
		console.error('Error loading teacher profiles:', error);
		return new Map();
	}

	return indexByUserId(data ?? []);
}
