import type { SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_shared/http.ts';
import type { LessonTypeRow } from './types.ts';

export async function verifyDuoLessonType(
	admin: SupabaseClient,
	lessonTypeId: string,
): Promise<{ ok: true; lessonType: LessonTypeRow } | { ok: false; response: Response }> {
	const { data: lessonType, error: ltErr } = await admin
		.from('lesson_types')
		.select('id, is_duo_lesson, is_group_lesson, is_active')
		.eq('id', lessonTypeId)
		.maybeSingle();
	if (ltErr || !lessonType) return { ok: false, response: jsonResponse(404, { error: 'Lessoort niet gevonden' }) };
	if (!lessonType.is_duo_lesson)
		return { ok: false, response: jsonResponse(422, { error: 'Lessoort is geen duo-lestype' }) };
	if (lessonType.is_group_lesson) {
		return { ok: false, response: jsonResponse(422, { error: 'Lessoort is een groepsles, niet duo' }) };
	}
	if (!lessonType.is_active) return { ok: false, response: jsonResponse(422, { error: 'Lessoort is niet actief' }) };
	return { ok: true, lessonType };
}
