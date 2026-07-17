import type { AgreementTableRow } from '@/types/lesson-agreements';

export interface AgreementWizardStudentDisplay {
	studentName: string;
	studentInitials: string;
}

export function buildAgreementWizardStudentDisplay(agreement: AgreementTableRow): AgreementWizardStudentDisplay {
	const studentName =
		[agreement.student.first_name, agreement.student.last_name].filter(Boolean).join(' ') ||
		agreement.student.email;

	const studentInitials =
		agreement.student.first_name && agreement.student.last_name
			? `${agreement.student.first_name[0]}${agreement.student.last_name[0]}`.toUpperCase()
			: agreement.student.first_name
				? agreement.student.first_name.slice(0, 2).toUpperCase()
				: agreement.student.email.slice(0, 2).toUpperCase();

	return { studentName, studentInitials };
}

export function shouldShowAgreementWizardEditHeader(
	isEditMode: boolean,
	agreement: AgreementTableRow | null,
): agreement is AgreementTableRow {
	return isEditMode && agreement !== null;
}
