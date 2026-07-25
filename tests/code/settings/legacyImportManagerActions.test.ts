import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import {
	runLegacyImportExecution,
	runLegacyImportTemplateDownload,
	runLegacyImportValidation,
} from '../../../src/lib/settings/legacyImportManagerActions';
import * as legacyImportManagerHelpers from '../../../src/lib/settings/legacyImportManagerHelpers';

describe('runLegacyImportTemplateDownload', () => {
	beforeEach(() => {
		spyOn(legacyImportManagerHelpers, 'fileToBase64').mockResolvedValue('dGVzdA==');
		spyOn(legacyImportManagerHelpers, 'downloadBlobFile').mockImplementation(() => {});
		spyOn(legacyImportManagerHelpers, 'fetchLegacyImportTemplate').mockResolvedValue(new Blob());
	});

	afterEach(() => {
		mock.restore();
	});

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
	beforeEach(() => {
		spyOn(legacyImportManagerHelpers, 'fileToBase64').mockResolvedValue('dGVzdA==');
	});

	afterEach(() => {
		mock.restore();
	});

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
	beforeEach(() => {
		spyOn(legacyImportManagerHelpers, 'fileToBase64').mockResolvedValue('dGVzdA==');
	});

	afterEach(() => {
		mock.restore();
	});

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
