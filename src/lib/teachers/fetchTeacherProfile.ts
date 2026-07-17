import { supabase } from '@/integrations/supabase/client';
import type { Teacher } from '@/types/teachers';

export async function fetchTeacherProfile(userId: string): Promise<Teacher | null> {
	const { data: teacherData, error: teacherError } = await supabase
		.from('teachers')
		.select('user_id, bio, is_active, created_at, updated_at')
		.eq('user_id', userId)
		.single();

	if (teacherError) {
		console.error('Error loading teacher:', teacherError);
		return null;
	}

	const { data: profileData, error: profileError } = await supabase
		.from('profiles')
		.select('user_id, first_name, last_name, email, avatar_url, phone_number')
		.eq('user_id', teacherData.user_id)
		.single();

	if (profileError) {
		console.error('Error loading profile:', profileError);
		return null;
	}

	return {
		...teacherData,
		...profileData,
	} as Teacher;
}
