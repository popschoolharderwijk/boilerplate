import { describe, expect, it } from 'bun:test';
import {
	isLegacyImportRunDisabled,
	isLegacyImportValidateDisabled,
} from '../../../src/lib/settings/legacyImportManagerUiHelpers';

describe('isLegacyImportValidateDisabled', () => {
	it('returns true when no file is selected', () => {
		expect(isLegacyImportValidateDisabled(null, false)).toBe(true);
	});

	it('returns true when busy', () => {
		expect(isLegacyImportValidateDisabled(new File(['x'], 'test.xlsx'), true)).toBe(true);
	});

	it('returns false when file is selected and not busy', () => {
		expect(isLegacyImportValidateDisabled(new File(['x'], 'test.xlsx'), false)).toBe(false);
	});
});

describe('isLegacyImportRunDisabled', () => {
	it('returns true when validation is missing', () => {
		expect(isLegacyImportRunDisabled(new File(['x'], 'test.xlsx'), false, null)).toBe(true);
	});

	it('returns true when validation failed', () => {
		expect(
			isLegacyImportRunDisabled(new File(['x'], 'test.xlsx'), false, {
				ok: false,
				errors: [],
				counts: {
					lesson_types: 0,
					lesson_type_options: 0,
					teachers: 0,
					students: 0,
					lesson_agreements: 0,
				},
			}),
		).toBe(true);
	});

	it('returns false when validation succeeded and file is ready', () => {
		expect(
			isLegacyImportRunDisabled(new File(['x'], 'test.xlsx'), false, {
				ok: true,
				errors: [],
				counts: {
					lesson_types: 1,
					lesson_type_options: 0,
					teachers: 0,
					students: 0,
					lesson_agreements: 0,
				},
			}),
		).toBe(false);
	});
});
