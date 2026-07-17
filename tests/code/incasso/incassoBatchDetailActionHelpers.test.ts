import { describe, expect, it, mock } from 'bun:test';
import {
	parseInvoiceGenerationResults,
	resolveSepaXmlStoragePath,
} from '../../../src/lib/incasso/incassoBatchDetailActionHelpers';

describe('parseInvoiceGenerationResults', () => {
	it('counts invoice generation results from invoke response', () => {
		expect(
			parseInvoiceGenerationResults({
				results: [{ invoice_number: 'INV-1' }, { error: 'failed' }],
			}),
		).toEqual({ ok: 1, failed: 1 });
	});

	it('returns zero counts when response is empty', () => {
		expect(parseInvoiceGenerationResults(null)).toEqual({ ok: 0, failed: 0 });
	});
});

describe('resolveSepaXmlStoragePath', () => {
	it('returns storage path from invoke response', () => {
		expect(resolveSepaXmlStoragePath({ storage_path: 'sepa/batch-1.xml' })).toBe('sepa/batch-1.xml');
	});

	it('returns null when storage path is missing', () => {
		expect(resolveSepaXmlStoragePath(null)).toBeNull();
	});
});

describe('createSignedSepaXmlDownloadUrl', () => {
	it('returns signed url from storage client', async () => {
		const createSignedUrl = mock(() =>
			Promise.resolve({ data: { signedUrl: 'https://example.com/file.xml' }, error: null }),
		);
		const supabase = {
			storage: { from: () => ({ createSignedUrl }) },
		} as never;

		const { createSignedSepaXmlDownloadUrl } = await import(
			'../../../src/lib/incasso/incassoBatchDetailActionHelpers'
		);
		const result = await createSignedSepaXmlDownloadUrl(supabase, 'sepa/batch-1.xml');
		expect(result).toEqual({ ok: true, signedUrl: 'https://example.com/file.xml' });
	});
});
