import { describe, expect, it } from 'bun:test';
import { emptyStudentForm } from '../../../src/components/students/studentFormTypes';
import { getStudentFormValidationError } from '../../../src/components/students/studentFormValidation';

describe('getStudentFormValidationError', () => {
	it('requires selecting a user in create existing-user mode', () => {
		const error = getStudentFormValidationError(emptyStudentForm, {
			isEditMode: false,
			mode: 'existing-user',
			selectedUserId: null,
		});
		expect(error).toBe('Selecteer een gebruiker');
	});

	it('requires an email in create new-user mode', () => {
		const error = getStudentFormValidationError(emptyStudentForm, {
			isEditMode: false,
			mode: 'new-user',
			selectedUserId: null,
		});
		expect(error).toBe('Email is verplicht');
	});

	it('validates email and phone fields', () => {
		const error = getStudentFormValidationError(
			{
				...emptyStudentForm,
				email: 'invalid-email',
				phone_number: '123',
				parent_phone_number: '456',
			},
			{
				isEditMode: true,
				mode: 'new-user',
				selectedUserId: null,
			},
		);
		expect(error).toBe('Ongeldig emailadres');
	});

	it('requires all debtor fields when debtor info differs from the student', () => {
		const error = getStudentFormValidationError(
			{
				...emptyStudentForm,
				email: 'student@example.com',
				debtor_info_same_as_student: false,
				debtor_name: 'Debiteur BV',
			},
			{
				isEditMode: true,
				mode: 'new-user',
				selectedUserId: null,
			},
		);
		expect(error).toBe(
			'Alle debiteur NAW velden zijn verplicht als debiteurinformatie niet gelijk is aan leerlinginformatie',
		);
	});

	it('returns null for a valid edit form', () => {
		const error = getStudentFormValidationError(
			{
				...emptyStudentForm,
				email: 'student@example.com',
				phone_number: '0612345678',
				debtor_info_same_as_student: false,
				debtor_name: 'Debiteur BV',
				debtor_address: 'Straat 1',
				debtor_postal_code: '1234AB',
				debtor_city: 'Amsterdam',
			},
			{
				isEditMode: true,
				mode: 'existing-user',
				selectedUserId: 'user-1',
			},
		);
		expect(error).toBe(null);
	});
});
