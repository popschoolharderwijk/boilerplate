import { describe, expect, it, mock } from 'bun:test';
import {
	runLegacyImportExecution,
	runLegacyImportTemplateDownload,
	runLegacyImportValidation,
} from '../../../src/lib/settings/legacyImportManagerActions';

mock.module('../../../src/lib/settings/legacyImportManagerHelpers', () => ({
	fileToBase64: async () => 'dGVzdA==',
	downloadBlobFile: () => {},
	fetchLegacyImportTemplate: async () => new Blob(),
	resolveLegacyValidationToast: () => undefined,
	resolveLegacyImportToast: () => undefined,
	toErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

describe('runLegacyImportTemplateDownload', () => {
	it('returns error when not logged in', async () => {
		const result = await runLegacyImportTemplateDownload(async () => null);
		expect(result).toEqual({
			ok: false,
			title: 'Kon template niet downloaden',
			message: 'Niet ingelogd',
		});
	});
});

describe('runLegacyImportValidation', () => {
	it('returns error when validation throws', async () => {
		const file = new File(['test'], 'import.xlsx');
		const result = await runLegacyImportValidation(
			{
				functions: {
					invoke: async () => ({ data: null, error: new Error('network') }),
				},
			} as never,
			file,
		);
		expect(result).toEqual({
			ok: false,
			title: 'Validatie mislukt',
			message: 'network',
		});
	});
});

describe('runLegacyImportExecution', () => {
	it('returns error when import throws', async () => {
		const file = new File(['test'], 'import.xlsx');
		const result = await runLegacyImportExecution(
			{
				functions: {
					invoke: async () => ({ data: null, error: new Error('import failed') }),
				},
			} as never,
			file,
		);
		expect(result).toEqual({
			ok: false,
			title: 'Import mislukt',
			message: 'import failed',
		});
	});
});
