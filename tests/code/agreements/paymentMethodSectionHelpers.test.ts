import { describe, expect, it } from 'bun:test';
import {
	applyLoadedSepaMandates,
	handlePaymentMethodSelection,
	maskSepaIban,
	resolveAutoSelectedSepaMandateId,
	resolveSepaMandateFieldView,
	shouldLoadSepaMandates,
} from '../../../src/lib/agreements/paymentMethodSectionHelpers';

describe('handlePaymentMethodSelection', () => {
	it('clears the sepa mandate when switching away from sepa', () => {
		let nextPaymentMethod = 'sepa';
		let nextMandateId: string | null = 'mandate-1';
		handlePaymentMethodSelection(
			'manual',
			(value) => {
				nextPaymentMethod = value;
			},
			(value) => {
				nextMandateId = value;
			},
		);
		expect(nextPaymentMethod).toBe('manual');
		expect(nextMandateId).toBeNull();
	});
});

describe('applyLoadedSepaMandates', () => {
	it('auto-selects the only mandate after load', () => {
		const selection = { mandateId: null as string | null };
		applyLoadedSepaMandates(
			[{ id: 'mandate-1', mandate_reference: 'M1', iban: 'NL91', account_holder: 'Jan', status: 'active' }],
			null,
			(value) => {
				selection.mandateId = value;
			},
		);
		expect(selection.mandateId).toBe('mandate-1');
	});
});

describe('maskSepaIban', () => {
	it('masks long iban values', () => {
		expect(maskSepaIban('NL91ABNA0417164300')).toBe('NL91 •••• 4300');
	});

	it('returns short iban values unchanged', () => {
		expect(maskSepaIban('NL91')).toBe('NL91');
	});
});

describe('resolveAutoSelectedSepaMandateId', () => {
	it('returns the current mandate id when one is already selected', () => {
		expect(
			resolveAutoSelectedSepaMandateId(
				[{ id: 'mandate-1', mandate_reference: 'M1', iban: 'NL91', account_holder: 'Jan', status: 'active' }],
				'mandate-1',
			),
		).toBe('mandate-1');
	});

	it('auto-selects the only available mandate', () => {
		expect(
			resolveAutoSelectedSepaMandateId(
				[{ id: 'mandate-1', mandate_reference: 'M1', iban: 'NL91', account_holder: 'Jan', status: 'active' }],
				null,
			),
		).toBe('mandate-1');
	});

	it('returns null when multiple mandates exist and none is selected', () => {
		expect(
			resolveAutoSelectedSepaMandateId(
				[
					{ id: 'mandate-1', mandate_reference: 'M1', iban: 'NL91', account_holder: 'Jan', status: 'active' },
					{
						id: 'mandate-2',
						mandate_reference: 'M2',
						iban: 'NL92',
						account_holder: 'Piet',
						status: 'active',
					},
				],
				null,
			),
		).toBeNull();
	});
});

describe('shouldLoadSepaMandates', () => {
	it('returns true for sepa payment with a student id', () => {
		expect(shouldLoadSepaMandates('sepa', 'student-1')).toBe(true);
	});

	it('returns false for non-sepa payment methods', () => {
		expect(shouldLoadSepaMandates('manual', 'student-1')).toBe(false);
	});
});

describe('resolveSepaMandateFieldView', () => {
	it('returns loading while mandates are fetched', () => {
		expect(resolveSepaMandateFieldView(true, 0)).toBe('loading');
	});

	it('returns empty when no mandates exist', () => {
		expect(resolveSepaMandateFieldView(false, 0)).toBe('empty');
	});

	it('returns select when mandates exist', () => {
		expect(resolveSepaMandateFieldView(false, 2)).toBe('select');
	});
});
