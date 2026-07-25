import type { RowError } from './types.ts';

export function parseLessonTypeLegacyIds(value: string | null | undefined): string[] {
	if (!value) return [];
	return value
		.split('|')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

export function buildUnknownLessonTypeLegacyIdError(rowIndex: number, legacyId: string): RowError {
	return {
		tab: 'teachers',
		row: rowIndex + 2,
		field: 'lesson_type_legacy_ids',
		message: `Onbekend: ${legacyId}`,
	};
}

export function normalizeLegacyParentEmail(value: string | null | undefined): string | null {
	if (!value || value === '') return null;
	return value;
}

export function isDuplicateAuthUserError(message: string): boolean {
	return message.includes('already') || message.includes('exists');
}

export function matchesAuthUserEmail(userEmail: string | null | undefined, targetEmail: string): boolean {
	return userEmail?.toLowerCase() === targetEmail.toLowerCase();
}

export function shouldStopAuthUserPagination(userCount: number, perPage: number): boolean {
	return userCount < perPage;
}

export function findAuthUserIdInList(
	users: Array<{ id: string; email?: string | null }>,
	email: string,
): string | null {
	const found = users.find((user) => matchesAuthUserEmail(user.email, email));
	return found?.id ?? null;
}

export function resolveLegacyTeacherImportOutcome(hadMapping: boolean): 'created' | 'updated' {
	return hadMapping ? 'updated' : 'created';
}

export function shouldLookupDuplicateAuthUser(message: string | undefined): boolean {
	return isDuplicateAuthUserError(message ?? '');
}

export function resolveCreatedAuthUserId(created: { user: { id: string } | null } | null): string | null {
	return created?.user?.id ?? null;
}

export function resolveAuthUserCreateFailureMessage(error: { message: string } | null): Error {
	if (error) return new Error(error.message);
	return new Error('Gebruiker kon niet worden aangemaakt');
}

export function buildLegacyStudentUpsertRow(row: {
	date_of_birth?: string | null;
	parent_name?: string | null;
	parent_email?: string | null;
	parent_phone_number?: string | null;
	debtor_info_same_as_student?: boolean | null;
	debtor_name?: string | null;
	debtor_address?: string | null;
	debtor_postal_code?: string | null;
	debtor_city?: string | null;
}) {
	return {
		date_of_birth: row.date_of_birth ?? null,
		parent_name: row.parent_name ?? null,
		parent_email: normalizeLegacyParentEmail(row.parent_email),
		parent_phone_number: row.parent_phone_number ?? null,
		debtor_info_same_as_student: row.debtor_info_same_as_student ?? true,
		debtor_name: row.debtor_name ?? null,
		debtor_address: row.debtor_address ?? null,
		debtor_postal_code: row.debtor_postal_code ?? null,
		debtor_city: row.debtor_city ?? null,
	};
}
