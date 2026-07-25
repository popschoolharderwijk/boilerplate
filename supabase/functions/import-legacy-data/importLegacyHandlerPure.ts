import type { RowError, Tab } from './types.ts';

export function isLegacyImportAdminRole(role: string | null | undefined): boolean {
	return role === 'admin' || role === 'site_admin';
}

export function resolveLegacyImportMissingAuthHeaderError(): { status: number; error: string } {
	return { status: 401, error: 'Missing authorization header' };
}

export function resolveLegacyImportInvalidTokenError(): { status: number; error: string } {
	return { status: 401, error: 'Invalid token' };
}

export function resolveLegacyImportForbiddenError(): { status: number; error: string } {
	return { status: 403, error: 'Geen rechten voor data-import' };
}

export function resolveLegacyImportUnknownActionError(): { status: number; error: string } {
	return { status: 400, error: 'Onbekende action' };
}

export function resolveLegacyImportMissingFileError(): { status: number; error: string } {
	return { status: 400, error: 'file_base64 ontbreekt' };
}

export function resolveLegacyImportValidationFailedError(errors: RowError[]): {
	status: number;
	error: string;
	errors: RowError[];
} {
	return { status: 400, error: 'Validatie faalt; fix eerst', errors };
}

export function buildLegacyImportValidateResponse(errors: RowError[], counts: Record<Tab, number>) {
	return { ok: errors.length === 0, errors, counts };
}

export function buildLegacyImportResultResponse(errors: RowError[], summaries: unknown[], counts: Record<Tab, number>) {
	return { ok: errors.length === 0, summaries, errors, counts };
}

export function resolveLegacyImportAction(
	method: string,
	bodyAction: string | undefined,
): 'template' | 'validate' | 'import' | 'unknown' {
	if (method === 'GET' || bodyAction === 'template') return 'template';
	if (bodyAction === 'validate') return 'validate';
	if (bodyAction === 'import') return 'import';
	return 'unknown';
}

export interface LegacyImportEnvConfig {
	supabaseUrl: string;
	anonKey: string;
	serviceKey: string;
}

export function readLegacyImportEnv(getEnv: (key: string) => string | undefined): LegacyImportEnvConfig {
	return {
		supabaseUrl: getEnv('SUPABASE_URL') ?? '',
		anonKey: getEnv('SUPABASE_ANON_KEY') ?? '',
		serviceKey: getEnv('SUPABASE_SERVICE_ROLE_KEY') ?? '',
	};
}

export function resolveLegacyImportAuthHeader(
	authHeader: string | null,
): { ok: true; authHeader: string } | { ok: false; status: number; error: string } {
	if (!authHeader) {
		const err = resolveLegacyImportMissingAuthHeaderError();
		return { ok: false, status: err.status, error: err.error };
	}
	return { ok: true, authHeader };
}

export function isAuthenticatedLegacyImportUser(user: { id: string } | null, authErr: unknown): user is { id: string } {
	return Boolean(user) && !authErr;
}
