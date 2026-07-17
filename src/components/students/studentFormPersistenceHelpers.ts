import type { StudentFormMode, StudentFormState } from '@/components/students/studentFormTypes';

export type StudentSubmitError = { ok: false; title: string; description?: string };
export type StudentSubmitSuccess = { ok: true; userId?: string };
export type StudentSubmitResult = StudentSubmitError | StudentSubmitSuccess;

export function resolveExistingUserIdForCreate(mode: StudentFormMode, selectedUserId: string | null): string | null {
	if (mode === 'existing-user' && selectedUserId) return selectedUserId;
	return null;
}

export function buildStudentProfileUpdateFields(form: StudentFormState): {
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
} {
	return {
		first_name: form.first_name || null,
		last_name: form.last_name || null,
		phone_number: form.phone_number || null,
	};
}

export function needsProfileUpdateAfterCreate(form: StudentFormState): boolean {
	return !!(form.first_name || form.last_name || form.phone_number);
}

export function resolveCreateStudentUserIdFromSelection(
	mode: StudentFormMode,
	selectedUserId: string | null,
): StudentSubmitSuccess {
	const existingUserId = resolveExistingUserIdForCreate(mode, selectedUserId);
	if (existingUserId) return { ok: true, userId: existingUserId };
	return { ok: true };
}

export function resolveCreateStudentUserIdAfterAuth(
	form: StudentFormState,
	authResult: StudentSubmitResult & { userId?: string },
	profileUpdateResult: StudentSubmitResult,
): StudentSubmitResult {
	if (!authResult.ok || !authResult.userId) return authResult;
	if (!needsProfileUpdateAfterCreate(form)) return { ok: true, userId: authResult.userId };
	if (!profileUpdateResult.ok) return profileUpdateResult;
	return { ok: true, userId: authResult.userId };
}

export function resolveAuthUserCreateResult(
	authError: { message: string } | null,
	user: { id: string } | null | undefined,
): StudentSubmitResult & { userId?: string } {
	if (authError || !user) {
		return {
			ok: false,
			title: 'Fout bij aanmaken gebruiker',
			description: authError?.message || 'Onbekende fout',
		};
	}

	return { ok: true, userId: user.id };
}

export function resolveStudentInsertResult(
	studentData: { user_id: string } | null,
	studentError: { message: string } | null,
): StudentSubmitResult {
	if (studentError || !studentData) {
		return {
			ok: false,
			title: 'Fout bij aanmaken leerling',
			description: studentError?.message || 'Onbekende fout',
		};
	}

	return { ok: true };
}
