import { describe, expect, it } from 'bun:test';
import { validateProfilePhone } from '../../../src/lib/account/persistence';

describe('validateProfilePhone', () => {
	it('returns no errors for an empty phone number', () => {
		expect(validateProfilePhone('')).toEqual({});
	});

	it('returns no errors for a 10-digit phone number', () => {
		expect(validateProfilePhone('0612345678')).toEqual({});
	});

	it('returns a validation error when the phone number is not 10 digits', () => {
		expect(validateProfilePhone('061234567')).toEqual({
			phone_number: 'Telefoonnummer moet precies 10 cijfers zijn',
		});
	});
});
