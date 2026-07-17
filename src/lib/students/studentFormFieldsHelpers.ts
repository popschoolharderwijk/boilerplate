export interface StudentDebtorFormFields {
	debtor_info_same_as_student: boolean;
	debtor_name: string;
	debtor_address: string;
	debtor_postal_code: string;
	debtor_city: string;
}

export function applyDebtorSameAsStudentToggle<T extends StudentDebtorFormFields>(form: T, checked: boolean): T {
	if (checked) {
		return {
			...form,
			debtor_info_same_as_student: true,
			debtor_name: '',
			debtor_address: '',
			debtor_postal_code: '',
			debtor_city: '',
		};
	}

	return {
		...form,
		debtor_info_same_as_student: false,
	};
}
