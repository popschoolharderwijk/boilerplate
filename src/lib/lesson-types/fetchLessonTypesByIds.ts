import { supabase } from '@/integrations/supabase/client';
import { indexById } from '@/lib/collections';
import type { LessonTypeDisplayFields } from '@/types/lesson-agreements';

export async function fetchLessonTypesByIds(ids: string[]): Promise<Map<string, LessonTypeDisplayFields>> {
	if (ids.length === 0) {
		return new Map();
	}

	const { data, error } = await supabase.from('lesson_types').select('id, name, icon, color').in('id', ids);
	if (error) {
		console.error('Error loading lesson types:', error);
		return new Map();
	}

	return indexById((data ?? []) as LessonTypeDisplayFields[]);
}
