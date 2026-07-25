import { describe, expect, it } from 'bun:test';
import {
	buildLegacyImportResultResponse,
	buildLegacyImportValidateResponse,
	isAuthenticatedLegacyImportUser,
	isLegacyImportAdminRole,
	readLegacyImportEnv,
	resolveLegacyImportAction,
	resolveLegacyImportAuthHeader,
	resolveLegacyImportForbiddenError,
	resolveLegacyImportMissingAuthHeaderError,
	resolveLegacyImportMissingFileError,
	resolveLegacyImportUnknownActionError,
	resolveLegacyImportValidationFailedError,
} from '../../../supabase/functions/import-legacy-data/importLegacyHandlerPure';

describe('isLegacyImportAdminRole', () => {
	it('returns true for admin roles', () => {
		expect(isLegacyImportAdminRole('admin')).toBe(true);
		expect(isLegacyImportAdminRole('site_admin')).toBe(true);
	});

	it('returns false for other roles', () => {
		expect(isLegacyImportAdminRole('staff')).toBe(false);
		expect(isLegacyImportAdminRole(null)).toBe(false);
	});
});

describe('resolveLegacyImportAction', () => {
	it('returns template for get requests', () => {
		expect(resolveLegacyImportAction('GET', undefined)).toBe('template');
	});

	it('returns validate and import for matching actions', () => {
		expect(resolveLegacyImportAction('POST', 'validate')).toBe('validate');
		expect(resolveLegacyImportAction('POST', 'import')).toBe('import');
	});

	it('returns unknown for unsupported actions', () => {
		expect(resolveLegacyImportAction('POST', 'delete')).toBe('unknown');
	});
});

describe('resolveLegacyImportMissingAuthHeaderError', () => {
	it('returns the missing auth header payload', () => {
		expect(resolveLegacyImportMissingAuthHeaderError()).toEqual({
			status: 401,
			error: 'Missing authorization header',
		});
	});
});

describe('resolveLegacyImportForbiddenError', () => {
	it('returns the forbidden payload', () => {
		expect(resolveLegacyImportForbiddenError()).toEqual({
			status: 403,
			error: 'Geen rechten voor data-import',
		});
	});
});

describe('resolveLegacyImportUnknownActionError', () => {
	it('returns the unknown action payload', () => {
		expect(resolveLegacyImportUnknownActionError()).toEqual({ status: 400, error: 'Onbekende action' });
	});
});

describe('resolveLegacyImportMissingFileError', () => {
	it('returns the missing file payload', () => {
		expect(resolveLegacyImportMissingFileError()).toEqual({ status: 400, error: 'file_base64 ontbreekt' });
	});
});

describe('resolveLegacyImportValidationFailedError', () => {
	it('returns the validation failed payload with errors', () => {
		const errors = [{ tab: 'teachers' as const, row: 2, field: 'email', message: 'invalid' }];
		expect(resolveLegacyImportValidationFailedError(errors)).toEqual({
			status: 400,
			error: 'Validatie faalt; fix eerst',
			errors,
		});
	});
});

describe('readLegacyImportEnv', () => {
	it('reads legacy import env keys', () => {
		expect(
			readLegacyImportEnv((key) => {
				const values: Record<string, string> = {
					SUPABASE_URL: 'https://supabase.example',
					SUPABASE_ANON_KEY: 'anon',
					SUPABASE_SERVICE_ROLE_KEY: 'service',
				};
				return values[key];
			}),
		).toEqual({
			supabaseUrl: 'https://supabase.example',
			anonKey: 'anon',
			serviceKey: 'service',
		});
	});
});

describe('resolveLegacyImportAuthHeader', () => {
	it('returns ok for present auth headers', () => {
		expect(resolveLegacyImportAuthHeader('Bearer token')).toEqual({ ok: true, authHeader: 'Bearer token' });
	});

	it('returns missing auth header errors', () => {
		expect(resolveLegacyImportAuthHeader(null)).toEqual({
			ok: false,
			status: 401,
			error: 'Missing authorization header',
		});
	});
});

describe('isAuthenticatedLegacyImportUser', () => {
	it('returns true when user exists without auth error', () => {
		expect(isAuthenticatedLegacyImportUser({ id: 'user-1' }, null)).toBe(true);
	});

	it('returns false when auth failed', () => {
		expect(isAuthenticatedLegacyImportUser(null, { message: 'invalid' })).toBe(false);
	});
});

describe('buildLegacyImportValidateResponse', () => {
	it('returns ok true when there are no errors', () => {
		expect(
			buildLegacyImportValidateResponse([], {
				teachers: 1,
				students: 0,
				lesson_types: 0,
				lesson_type_options: 0,
				lesson_agreements: 0,
			}),
		).toEqual({
			ok: true,
			errors: [],
			counts: { teachers: 1, students: 0, lesson_types: 0, lesson_type_options: 0, lesson_agreements: 0 },
		});
	});
});

describe('buildLegacyImportResultResponse', () => {
	it('returns ok false when import errors exist', () => {
		const errors = [{ tab: 'students' as const, row: 3, field: 'email', message: 'invalid' }];
		expect(
			buildLegacyImportResultResponse(errors, [], {
				teachers: 0,
				students: 1,
				lesson_types: 0,
				lesson_type_options: 0,
				lesson_agreements: 0,
			}),
		).toEqual({
			ok: false,
			summaries: [],
			errors,
			counts: { teachers: 0, students: 1, lesson_types: 0, lesson_type_options: 0, lesson_agreements: 0 },
		});
	});
});
