import { describe, expect, it } from 'bun:test';
import { matchesInvoiceSearch } from '../../../src/lib/invoices/invoiceSearchHelpers';

describe('matchesInvoiceSearch', () => {
	const row = {
		invoice_number: 'INV-2026-001',
		profiles: { first_name: 'Jan', last_name: 'Jansen', email: 'jan@example.com' },
	};

	it('matches all rows when search is empty', () => {
		expect(matchesInvoiceSearch(row, '')).toBe(true);
	});

	it('matches invoice number', () => {
		expect(matchesInvoiceSearch(row, 'inv-2026')).toBe(true);
	});

	it('matches student name', () => {
		expect(matchesInvoiceSearch(row, 'jansen')).toBe(true);
	});

	it('matches student email', () => {
		expect(matchesInvoiceSearch(row, 'jan@example.com')).toBe(true);
	});

	it('returns false when nothing matches', () => {
		expect(matchesInvoiceSearch(row, 'geen-match')).toBe(false);
	});
});
