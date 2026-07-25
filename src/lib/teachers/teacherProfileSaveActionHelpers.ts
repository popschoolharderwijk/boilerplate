import type { SupabaseClient } from '@supabase/supabase-js';
import { saveTeacherProfileUpdates, type TeacherProfileSaveError } from '@/lib/teachers/teacherProfileSaveHelpers';
import { canSaveTeacherProfile, type TeacherProfileFormValues } from '@/lib/teachers/teacherProfileSectionHelpers';

export function resolveTeacherProfileSaveErrorLabel(error: TeacherProfileSaveError): string {
	return error === 'bio' ? 'bio' : 'profiel';
}

export type TeacherProfileSaveActionResult =
	| { saved: false }
	| { saved: true }
	| { saved: false; error: TeacherProfileSaveError; message: string };

export async function runTeacherProfileSave(params: {
	supabase: SupabaseClient;
	teacherUserId: string;
	userId: string;
	canEdit: boolean;
	hasUser: boolean;
	form: TeacherProfileFormValues;
}): Promise<TeacherProfileSaveActionResult> {
	if (!canSaveTeacherProfile(params.teacherUserId, params.userId, params.canEdit, params.hasUser)) {
		return { saved: false };
	}

	const result = await saveTeacherProfileUpdates(params.supabase, params.teacherUserId, params.userId, params.form);
	if (result.ok === false) {
		return { saved: false, error: result.error, message: result.message };
	}

	return { saved: true };
}
