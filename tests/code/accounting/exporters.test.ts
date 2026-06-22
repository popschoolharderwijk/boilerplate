/**
 * Unit tests voor boekhouding journaalpost-generatie.
 */
import { describe, expect, it } from 'bun:test';
import { generateCsv, generateExactXml, generateJournalLines } from '../../../src/lib/accounting/exporters';
import type { AccountingReport, AccountingSettings } from '../../../src/lib/accounting/types';

const SETTINGS: AccountingSettings = {
	id: true,
	journal_code_memoriaal: '90',
	journal_code_bank: '20',
	account_debiteuren: '1300',
	account_omzet_under_21: '8000',
	account_omzet_21_plus: '8010',
	account_btw_21: '1500',
	account_bank_stripe: '1100',
	btw_code_21: 'VH',
	btw_code_exempt: '0',
	currency: 'EUR',
	school_year_start_month: 8,
	description_template: 'x',
	account_bank_sepa: '1102',
	payment_provider: 'stripe',
	sepa_creditor_name: null,
	sepa_creditor_iban: null,
	sepa_creditor_bic: null,
	sepa_creditor_id: null,
	sepa_collection_day: 27,
	sepa_remittance_template: 'Lesgeld {month} {year} - {student_name}',
	sepa_mandate_prefix: 'MND',
	sepa_mandate_next_seq: 1,
};

function makeReport(overrides: Partial<AccountingReport['invoices'][number]> = {}): AccountingReport {
	return {
		period: { start: '2026-06-01', end: '2026-06-30' },
		summary: {
			invoice_count: 1,
			total_omzet_under_21_cents: 0,
			total_omzet_21_plus_excl_cents: 0,
			total_btw_cents: 0,
			total_debiteuren_cents: 0,
			total_paid_cents: 0,
			total_open_cents: 0,
		},
		by_cost_center: [],
		invoices: [
			{
				invoice_id: 'inv-1',
				stripe_invoice_id: 'in_test_1',
				status: 'paid',
				amount_due_cents: 12100,
				amount_paid_cents: 12100,
				amount_excl_btw_cents: 10000,
				btw_amount_cents: 2100,
				currency: 'eur',
				period_start: '2026-06-01T00:00:00Z',
				paid_at: '2026-06-03T10:00:00Z',
				hosted_invoice_url: null,
				age_category: '21_plus',
				cost_center: 'Piano',
				lesson_type_id: 'lt-1',
				lesson_type_name: 'Piano',
				lesson_type_icon: null,
				lesson_type_color: null,
				student_user_id: 'usr-1',
				student_name: 'Jan Jansen',
				...overrides,
			},
		],
	};
}

describe('generateJournalLines', () => {
	it('genereert 5 regels voor betaalde 21+ factuur (deb, omzet, btw, bank, deb-credit)', () => {
		const lines = generateJournalLines(makeReport(), SETTINGS);
		expect(lines.length).toBe(5);
		const factuur = lines.filter((l) => l.entryId === 'FACT-inv-1');
		expect(factuur.length).toBe(3);
		const sumDeb = factuur.reduce((s, l) => s + l.debit, 0);
		const sumCred = factuur.reduce((s, l) => s + l.credit, 0);
		expect(sumDeb).toBe(sumCred);
		expect(sumDeb).toBe(12100);
	});

	it('genereert 3 regels voor onbetaalde <21 factuur (deb + omzet vrijgesteld)', () => {
		const lines = generateJournalLines(
			makeReport({
				status: 'open',
				paid_at: null,
				amount_paid_cents: 0,
				age_category: 'under_21',
				amount_excl_btw_cents: 5000,
				btw_amount_cents: 0,
				amount_due_cents: 5000,
			}),
			SETTINGS,
		);
		expect(lines.length).toBe(2);
		const sumDeb = lines.reduce((s, l) => s + l.debit, 0);
		const sumCred = lines.reduce((s, l) => s + l.credit, 0);
		expect(sumDeb).toBe(sumCred);
		const omzet = lines.find((l) => l.account === '8000');
		expect(omzet?.credit).toBe(5000);
	});

	it('gebruikt vrijgestelde omzetrekening voor unknown leeftijd', () => {
		const lines = generateJournalLines(
			makeReport({
				age_category: 'unknown',
				amount_excl_btw_cents: 7500,
				btw_amount_cents: 0,
				amount_due_cents: 7500,
				status: 'open',
				paid_at: null,
				amount_paid_cents: 0,
			}),
			SETTINGS,
		);
		expect(lines.find((l) => l.account === '8000')?.credit).toBe(7500);
		expect(lines.find((l) => l.account === '8010')).toBeUndefined();
	});
});

describe('generateCsv', () => {
	it('bevat header en juiste delimiter', () => {
		const csv = generateCsv(generateJournalLines(makeReport(), SETTINGS));
		expect(csv.startsWith('Mutatienr;Datum;Dagboek;')).toBe(true);
		expect(csv).toContain('1300');
		expect(csv).toContain('Jan Jansen');
	});

	it('escapet velden met speciale tekens', () => {
		const lines = generateJournalLines(makeReport({ student_name: 'Naam; met;komma' }), SETTINGS);
		const csv = generateCsv(lines);
		expect(csv).toContain('"Naam; met;komma"');
	});
});

describe('generateExactXml', () => {
	it('bevat GLTransaction per entry en juiste journal codes', () => {
		const lines = generateJournalLines(makeReport(), SETTINGS);
		const xml = generateExactXml(lines, SETTINGS);
		expect(xml).toContain('<eExact');
		expect(xml).toContain('entry="FACT-inv-1"');
		expect(xml).toContain('entry="PAY-inv-1"');
		expect(xml).toContain('code="90"');
		expect(xml).toContain('code="20"');
		expect(xml).toContain('vatcode="VH"');
	});

	it('escapet xml entities in beschrijvingen', () => {
		const lines = generateJournalLines(makeReport({ student_name: 'A & B' }), SETTINGS);
		const xml = generateExactXml(lines, SETTINGS);
		expect(xml).toContain('A &amp; B');
	});
});
