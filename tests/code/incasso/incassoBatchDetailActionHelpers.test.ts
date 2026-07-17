import { describe, expect, it, mock } from 'bun:test';
import {
	generateInvoicesForIncassoBatch,
	resolveSepaXmlStoragePath,
} from '../../../src/lib/incasso/incassoBatchDetailActionHelpers';

describe('generateInvoicesForIncassoBatch', () => {
	it('counts invoice generation results from invoke response', async () => {
		const supabase = {
			functions: {
				invoke: async () => ({
					data: { results: [{ invoice_number: 'INV-1' }, { error: 'failed' }] },
					error: null,
				}),
			},
		} as never;

		const result = await generateInvoicesForIncassoBatch(supabase, 'batch-1');
		expect(result).toEqual({
			ok: true,
			message: 'Batch goedgekeurd — 1 factuur/facturen aangemaakt, 1 fout.',
		});
	});

	it('returns zero counts when response is empty', async () => {
		const supabase = {
			functions: {
				invoke: async () => ({ data: null, error: null }),
			},
		} as never;

		const result = await generateInvoicesForIncassoBatch(supabase, 'batch-1');
		expect(result).toEqual({
			ok: true,
			message: 'Batch goedgekeurd — 0 factuur/facturen aangemaakt.',
		});
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
