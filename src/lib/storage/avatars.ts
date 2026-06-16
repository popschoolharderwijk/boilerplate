import { supabase } from '@/integrations/supabase/client';

export async function removeUserAvatarFiles(userId: string): Promise<{ error: Error | null }> {
	const { data: existingFiles } = await supabase.storage.from('avatars').list('', { search: userId });
	if (!existingFiles?.length) return { error: null };

	const filesToDelete = existingFiles.filter((f) => f.name.startsWith(userId)).map((f) => f.name);
	if (filesToDelete.length === 0) return { error: null };

	const { error } = await supabase.storage.from('avatars').remove(filesToDelete);
	return { error: error ? new Error(error.message) : null };
}
