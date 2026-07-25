import {
	isValidEmail,
	isValidPhone,
	type StudentFormMode,
	type StudentFormState,
} from '@/components/students/studentFormTypes';

function getCreateModeValidationError(
	form: StudentFormState,
	mode: StudentFormMode,
	selectedUserId: string | null,
): string | null {
	if (mode === 'existing-user' && !selectedUserId) {
		return 'Selecteer een gebruiker';
	}
	if (mode === 'new-user' && !form.email) {
		return 'Email is verplicht';
	}
	return null;
}

function getContactValidationError(form: StudentFormState): string | null {
	if (form.email && !isValidEmail(form.email)) {
		return 'Ongeldig emailadres';
	}
	if (form.phone_number && !isValidPhone(form.phone_number)) {
		return 'Telefoonnummer moet 10 cijfers bevatten';
	}
	if (form.parent_phone_number && !isValidPhone(form.parent_phone_number)) {
		return 'Ouder telefoonnummer moet 10 cijfers bevatten';
	}
	return null;
}

function getDebtorValidationError(form: StudentFormState): string | null {
	if (form.debtor_info_same_as_student) return null;
	if (form.debtor_name && form.debtor_address && form.debtor_postal_code && form.debtor_city) {
		return null;
	}
	return 'Alle debiteur NAW velden zijn verplicht als debiteurinformatie niet gelijk is aan leerlinginformatie';
}

interface StudentFormValidationContext {
	isEditMode: boolean;
	mode: StudentFormMode;
	selectedUserId: string | null;
}

export function getStudentFormValidationError(
	form: StudentFormState,
	context: StudentFormValidationContext,
): string | null {
	if (!context.isEditMode) {
		const createError = getCreateModeValidationError(form, context.mode, context.selectedUserId);
		if (createError) return createError;
	}

	const contactError = getContactValidationError(form);
	if (contactError) return contactError;

	return getDebtorValidationError(form);
}
