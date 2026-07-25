import { describe, expect, it } from 'bun:test';
import { applyDebtorSameAsStudentToggle } from '../../../src/lib/students/studentFormFieldsHelpers';

describe('applyDebtorSameAsStudentToggle', () => {
	it('clears debtor fields when same-as-student is enabled', () => {
		const result = applyDebtorSameAsStudentToggle(
			{
				debtor_info_same_as_student: false as boolean,
				debtor_name: 'Debiteur',
				debtor_address: 'Straat 1',
				debtor_postal_code: '1234 AB',
				debtor_city: 'Amsterdam',
			},
			true,
		);
		expect(result.debtor_info_same_as_student).toBe(true);
		expect(result.debtor_name).toBe('');
		expect(result.debtor_address).toBe('');
		expect(result.debtor_postal_code).toBe('');
		expect(result.debtor_city).toBe('');
	});

	it('keeps debtor fields when same-as-student is disabled', () => {
		const result = applyDebtorSameAsStudentToggle(
			{
				debtor_info_same_as_student: true as boolean,
				debtor_name: '',
				debtor_address: '',
				debtor_postal_code: '',
				debtor_city: '',
			},
			false,
		);
		expect(result.debtor_info_same_as_student).toBe(false);
		expect(result.debtor_name).toBe('');
		expect(result.debtor_address).toBe('');
		expect(result.debtor_postal_code).toBe('');
		expect(result.debtor_city).toBe('');
	});
});
