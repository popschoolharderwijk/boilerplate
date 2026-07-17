import { beforeAll, describe, expect, it, mock } from 'bun:test';

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: () => ({
			select: () => ({
				eq: () => ({
					in: () => ({
						order: async () => ({ data: [] }),
					}),
				}),
			}),
		}),
	},
}));

describe('paymentMethodSectionHelpers', () => {
	let helpers: typeof import('../../../src/lib/agreements/paymentMethodSectionHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/agreements/paymentMethodSectionHelpers');
	});

	const singleMandate = [
		{ id: 'mandate-1', mandate_reference: 'M1', iban: 'NL91', account_holder: 'Jan', status: 'active' },
	];

	describe('handlePaymentMethodSelection', () => {
		it('clears the sepa mandate when switching away from sepa', () => {
			let nextPaymentMethod = 'sepa';
			let nextMandateId: string | null = 'mandate-1';
			helpers.handlePaymentMethodSelection(
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
			helpers.applyLoadedSepaMandates(singleMandate, null, (value) => {
				selection.mandateId = value;
			});
			expect(selection.mandateId).toBe('mandate-1');
		});

		it('keeps the current mandate when one is already selected', () => {
			const selection = { mandateId: 'mandate-1' as string | null };
			helpers.applyLoadedSepaMandates(singleMandate, 'mandate-1', (value) => {
				selection.mandateId = value;
			});
			expect(selection.mandateId).toBe('mandate-1');
		});

		it('does not auto-select when multiple mandates exist and none is selected', () => {
			let mandateChanged = false;
			helpers.applyLoadedSepaMandates(
				[
					...singleMandate,
					{
						id: 'mandate-2',
						mandate_reference: 'M2',
						iban: 'NL92',
						account_holder: 'Piet',
						status: 'active',
					},
				],
				null,
				() => {
					mandateChanged = true;
				},
			);
			expect(mandateChanged).toBe(false);
		});
	});

	describe('maskSepaIban', () => {
		it('masks long iban values', () => {
			expect(helpers.maskSepaIban('NL91ABNA0417164300')).toBe('NL91 •••• 4300');
		});

		it('returns short iban values unchanged', () => {
			expect(helpers.maskSepaIban('NL91')).toBe('NL91');
		});
	});

	describe('shouldLoadSepaMandates', () => {
		it('returns true for sepa payment with a student id', () => {
			expect(helpers.shouldLoadSepaMandates('sepa', 'student-1')).toBe(true);
		});

		it('returns false for non-sepa payment methods', () => {
			expect(helpers.shouldLoadSepaMandates('manual', 'student-1')).toBe(false);
		});
	});

	describe('resolveSepaMandateFieldView', () => {
		it('returns loading while mandates are fetched', () => {
			expect(helpers.resolveSepaMandateFieldView(true, 0)).toBe('loading');
		});

		it('returns empty when no mandates exist', () => {
			expect(helpers.resolveSepaMandateFieldView(false, 0)).toBe('empty');
		});

		it('returns select when mandates exist', () => {
			expect(helpers.resolveSepaMandateFieldView(false, 2)).toBe('select');
		});
	});
});
