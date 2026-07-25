import type { ValidationResponse } from '@/lib/settings/legacyImportManagerHelpers';

export function isLegacyImportValidateDisabled(file: File | null, busy: boolean): boolean {
	return !file || busy;
}

export function isLegacyImportRunDisabled(
	file: File | null,
	busy: boolean,
	validation: ValidationResponse | null,
): boolean {
	return !file || busy || !validation?.ok;
}
