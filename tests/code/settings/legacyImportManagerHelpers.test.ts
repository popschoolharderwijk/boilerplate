import { describe, expect, it } from 'bun:test';
import {
	errorsToCsv,
	resolveLegacyImportToast,
	resolveLegacyValidationToast,
	toErrorMessage,
} from '../../../src/lib/settings/legacyImportManagerHelpers';

describe('errorsToCsv', () => {
	it('serializes row errors to csv', () => {
		expect(errorsToCsv([{ tab: 'students', row: 2, field: 'email', message: 'Invalid email' }])).toBe(
			'tab,row,field,message\n"students","2","email","Invalid email"',
		);
	});
});

describe('resolveLegacyValidationToast', () => {
	it('returns success when validation passed', () => {
		expect(
			resolveLegacyValidationToast({
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
		).toEqual({ kind: 'success', message: 'Validatie geslaagd — klaar om te importeren' });
	});

	it('returns warning with error count', () => {
		expect(
			resolveLegacyValidationToast({
				ok: false,
				errors: [{ tab: 'students', row: 1, message: 'Missing email' }],
				counts: {
					lesson_types: 0,
					lesson_type_options: 0,
					teachers: 0,
					students: 1,
					lesson_agreements: 0,
				},
			}),
		).toEqual({ kind: 'warning', message: 'Validatie meldt 1 fout(en)' });
	});
});

describe('resolveLegacyImportToast', () => {
	it('returns success when import passed', () => {
		expect(
			resolveLegacyImportToast({
				ok: true,
				summaries: [],
				errors: [],
				counts: {
					lesson_types: 0,
					lesson_type_options: 0,
					teachers: 0,
					students: 0,
					lesson_agreements: 0,
				},
			}),
		).toEqual({ kind: 'success', message: 'Import voltooid' });
	});
});

describe('toErrorMessage', () => {
	it('returns message for Error instances', () => {
		expect(toErrorMessage(new Error('failed'))).toBe('failed');
	});

	it('returns fallback for unknown values', () => {
		expect(toErrorMessage('x')).toBe('Onbekend');
	});
});
