import { toast } from 'sonner';
import {
	buildStudentProfileUpdateFields,
	needsProfileUpdateAfterCreate,
	resolveAuthUserCreateResult,
	resolveCreateStudentUserIdAfterAuth,
	resolveCreateStudentUserIdFromSelection,
	resolveStudentInsertResult,
	type StudentSubmitError,
	type StudentSubmitResult,
} from '@/components/students/studentFormPersistenceHelpers';
import {
	type StudentFormMode,
	type StudentFormState,
	studentRecordFields,
} from '@/components/students/studentFormTypes';
import { supabase } from '@/integrations/supabase/client';
import type { Student } from '@/types/students';

export type { StudentSubmitError, StudentSubmitResult } from '@/components/students/studentFormPersistenceHelpers';

async function updateProfileForUser(
	userId: string,
	form: StudentFormState,
	errorTitle: string,
): Promise<StudentSubmitResult> {
	const { error } = await supabase
		.from('profiles')
		.update(buildStudentProfileUpdateFields(form))
		.eq('user_id', userId);

	if (error) {
		return { ok: false, title: errorTitle, description: error.message };
	}
	return { ok: true };
}

export async function updateExistingStudent(student: Student, form: StudentFormState): Promise<StudentSubmitResult> {
	const profileResult = await updateProfileForUser(student.user_id, form, 'Fout bij bijwerken profiel');
	if (!profileResult.ok) return profileResult;

	const { error: studentError } = await supabase
		.from('students')
		.update(studentRecordFields(form))
		.eq('user_id', student.user_id);

	if (studentError) {
		return { ok: false, title: 'Fout bij bijwerken leerling', description: studentError.message };
	}

	return { ok: true };
}

async function createAuthUser(form: StudentFormState): Promise<StudentSubmitResult & { userId?: string }> {
	const { data: authData, error: authError } = await supabase.auth.admin.createUser({
		email: form.email,
		email_confirm: true,
		user_metadata: {
			first_name: form.first_name || undefined,
			last_name: form.last_name || undefined,
		},
	});

	return resolveAuthUserCreateResult(authError, authData.user);
}

async function resolveUserIdForNewStudentCreate(form: StudentFormState): Promise<StudentSubmitResult> {
	const authResult = await createAuthUser(form);
	if (!authResult.ok || !authResult.userId) return authResult;

	if (!needsProfileUpdateAfterCreate(form)) {
		return { ok: true, userId: authResult.userId };
	}

	const profileResult = await updateProfileForUser(authResult.userId, form, 'Fout bij bijwerken profiel');
	if (!profileResult.ok) {
		console.error('Error updating profile after user creation');
	}
	return resolveCreateStudentUserIdAfterAuth(form, authResult, profileResult);
}

async function resolveUserIdForCreate(
	form: StudentFormState,
	mode: StudentFormMode,
	selectedUserId: string | null,
): Promise<StudentSubmitResult> {
	const selectionResult = resolveCreateStudentUserIdFromSelection(mode, selectedUserId);
	if (selectionResult.userId) return selectionResult;

	return resolveUserIdForNewStudentCreate(form);
}

export async function createStudentRecord(
	form: StudentFormState,
	mode: StudentFormMode,
	selectedUserId: string | null,
): Promise<StudentSubmitResult> {
	const userResult = await resolveUserIdForCreate(form, mode, selectedUserId);
	if (!userResult.ok || !userResult.userId) return userResult;

	const { data: studentData, error: studentError } = await supabase
		.from('students')
		.insert({ user_id: userResult.userId, ...studentRecordFields(form) })
		.select('user_id')
		.single();

	return resolveStudentInsertResult(studentData, studentError);
}

export function showStudentSubmitError(result: StudentSubmitError): void {
	toast.error(result.title, result.description ? { description: result.description } : undefined);
}
