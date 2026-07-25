import type { SupabaseClient } from '@supabase/supabase-js';
import {
	buildTeacherProfileNameUpdate,
	buildTeacherProfileUpdate,
	type TeacherProfileSaveInput,
} from '@/lib/teachers/teacherProfileSectionHelpers';

export type TeacherProfileSaveError = 'bio' | 'profile';

export type TeacherProfileSaveResult = { ok: true } | { ok: false; error: TeacherProfileSaveError; message: string };

export async function saveTeacherProfileUpdates(
	supabase: SupabaseClient,
	teacherUserId: string,
	userId: string,
	form: TeacherProfileSaveInput,
): Promise<TeacherProfileSaveResult> {
	const { error: bioError } = await supabase
		.from('teachers')
		.update(buildTeacherProfileUpdate(form) as never)
		.eq('user_id', teacherUserId);

	if (bioError) return { ok: false, error: 'bio', message: bioError.message };

	const { error: profileError } = await supabase
		.from('profiles')
		.update(buildTeacherProfileNameUpdate(form))
		.eq('user_id', userId);

	if (profileError) return { ok: false, error: 'profile', message: profileError.message };
	return { ok: true };
}
