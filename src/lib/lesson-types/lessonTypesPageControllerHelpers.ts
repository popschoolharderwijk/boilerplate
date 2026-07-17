import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { type LessonTypeListItem, translateLessonTypeDeleteError } from '@/lib/lesson-types/lessonTypesPageHelpers';

export function filterDeletedLessonType(lessonTypes: LessonTypeListItem[], deletedId: string): LessonTypeListItem[] {
	return lessonTypes.filter((lessonType) => lessonType.id !== deletedId);
}

export interface RunLessonTypeDeleteParams {
	lessonType: LessonTypeListItem;
	supabase: SupabaseClient;
	setLessonTypes: (updater: (prev: LessonTypeListItem[]) => LessonTypeListItem[]) => void;
	setDeleteDialog: (value: null) => void;
}

export async function runLessonTypeDelete(params: RunLessonTypeDeleteParams): Promise<void> {
	try {
		const { error } = await params.supabase.from('lesson_types').delete().eq('id', params.lessonType.id);

		if (error) {
			const translatedMessage = translateLessonTypeDeleteError(error.message);
			toast.error('Fout bij verwijderen lessoort', { description: translatedMessage });
			throw new Error(translatedMessage);
		}

		toast.success('Lessoort verwijderd', {
			description: `${params.lessonType.name} is verwijderd.`,
		});

		params.setLessonTypes((prev) => filterDeletedLessonType(prev, params.lessonType.id));
		params.setDeleteDialog(null);
	} catch (error) {
		console.error('Error deleting lesson type:', error);
		toast.error('Fout bij verwijderen lessoort', {
			description: 'Er is een netwerkfout opgetreden. Probeer het later opnieuw.',
		});
		throw error;
	}
}
