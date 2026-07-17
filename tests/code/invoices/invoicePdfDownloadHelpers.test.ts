import { describe, expect, it } from 'bun:test';
import {
	downloadInvoicePdf,
	extractInvoicePdfSignedUrl,
	formatInvoiceStudentName,
	resolveMissingInvoicePdfUrlError,
} from '../../../src/lib/invoices/invoicePdfDownloadHelpers';

describe('extractInvoicePdfSignedUrl', () => {
	it('returns signed url from invoke response', () => {
		expect(extractInvoicePdfSignedUrl({ signed_url: 'https://storage.example/pdf' })).toBe(
			'https://storage.example/pdf',
		);
	});

	it('returns null when signed url is missing', () => {
		expect(extractInvoicePdfSignedUrl({})).toBeNull();
	});
});

describe('downloadInvoicePdf', () => {
	it('returns url when invoke succeeds', async () => {
		const result = await downloadInvoicePdf(
			async () => ({ data: { signed_url: 'https://storage.example/pdf' }, error: null }),
			'invoice-1',
		);
		expect(result).toEqual({ ok: true, url: 'https://storage.example/pdf' });
	});

	it('returns invoke error message', async () => {
		const result = await downloadInvoicePdf(
			async () => ({ data: null, error: { message: 'not found' } }),
			'invoice-1',
		);
		expect(result).toEqual({ ok: false, message: 'not found' });
	});

	it('returns missing url error when signed url is absent', async () => {
		const result = await downloadInvoicePdf(async () => ({ data: {}, error: null }), 'invoice-1');
		expect(result).toEqual({ ok: false, message: resolveMissingInvoicePdfUrlError() });
	});
});

describe('formatInvoiceStudentName', () => {
	it('returns dash when profile is missing', () => {
		expect(formatInvoiceStudentName(null)).toBe('—');
	});

	it('returns full name when available', () => {
		expect(
			formatInvoiceStudentName({
				first_name: 'Jan',
				last_name: 'Jansen',
				email: 'jan@example.nl',
			}),
		).toBe('Jan Jansen');
	});

	it('falls back to email when name is empty', () => {
		expect(
			formatInvoiceStudentName({
				first_name: null,
				last_name: null,
				email: 'jan@example.nl',
			}),
		).toBe('jan@example.nl');
	});
});
