import { describe, expect, it } from 'bun:test';
import {
	applyAccountPhoneFieldChange,
	canConfirmAccountDelete,
	mapLoadedProfileToFormState,
} from '../../../src/lib/account/accountPageHelpers';

describe('mapLoadedProfileToFormState', () => {
	it('maps null profile fields to empty strings', () => {
		expect(
			mapLoadedProfileToFormState({
				first_name: null,
				last_name: 'Bakker',
				phone_number: null,
				avatar_url: null,
			}),
		).toEqual({
			first_name: '',
			last_name: 'Bakker',
			phone_number: '',
		});
	});
});

describe('canConfirmAccountDelete', () => {
	it('requires exact email confirmation', () => {
		expect(canConfirmAccountDelete('user@example.com', 'user@example.com')).toBe(true);
		expect(canConfirmAccountDelete('wrong@example.com', 'user@example.com')).toBe(false);
	});
});

describe('applyAccountPhoneFieldChange', () => {
	it('sets phone validation error for invalid numbers', () => {
		expect(applyAccountPhoneFieldChange({ first_name: '', last_name: '', phone_number: '' }, {}, '061234')).toEqual(
			{
				formData: { first_name: '', last_name: '', phone_number: '061234' },
				errors: { phone_number: 'Telefoonnummer moet precies 10 cijfers zijn' },
			},
		);
	});

	it('clears phone validation error for valid numbers', () => {
		expect(
			applyAccountPhoneFieldChange(
				{ first_name: '', last_name: '', phone_number: '' },
				{ phone_number: 'Telefoonnummer moet precies 10 cijfers zijn' },
				'0612345678',
			),
		).toEqual({
			formData: { first_name: '', last_name: '', phone_number: '0612345678' },
			errors: { phone_number: undefined },
		});
	});
});
