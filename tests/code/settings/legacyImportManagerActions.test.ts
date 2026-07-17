import { describe, expect, it } from 'bun:test';
import {
	runLegacyImportExecutionBase64,
	runLegacyImportTemplateDownload,
	runLegacyImportValidationBase64,
} from '../../../src/lib/settings/legacyImportManagerActions';

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

describe('runLegacyImportValidationBase64', () => {
	it('returns error when validation throws', async () => {
		const result = await runLegacyImportValidationBase64(
			{
				functions: {
					invoke: async () => ({ data: null, error: new Error('network') }),
				},
			} as never,
			'dGVzdA==',
		);
		expect(result).toEqual({
			ok: false,
			title: 'Validatie mislukt',
			message: 'network',
		});
	});
});

describe('runLegacyImportExecutionBase64', () => {
	it('returns error when import throws', async () => {
		const result = await runLegacyImportExecutionBase64(
			{
				functions: {
					invoke: async () => ({ data: null, error: new Error('import failed') }),
				},
			} as never,
			'dGVzdA==',
		);
		expect(result).toEqual({
			ok: false,
			title: 'Import mislukt',
			message: 'import failed',
		});
	});
});
