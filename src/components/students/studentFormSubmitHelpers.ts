import { toast } from 'sonner';
import {
	createStudentRecord,
	showStudentSubmitError,
	updateExistingStudent,
} from '@/components/students/studentFormPersistence';
import type { StudentFormMode, StudentFormState } from '@/components/students/studentFormTypes';
import { getStudentFormValidationError } from '@/components/students/studentFormValidation';
import type { Student } from '@/types/students';

export interface StudentFormSubmitParams {
	form: StudentFormState;
	isEditMode: boolean;
	mode: StudentFormMode;
	selectedUserId: string | null;
	student?: Student;
}

export type StudentFormSubmitOutcome = 'validation-error' | 'persist-error' | 'success';

export async function executeStudentFormSubmit(params: StudentFormSubmitParams): Promise<StudentFormSubmitOutcome> {
	const validationError = getStudentFormValidationError(params.form, {
		isEditMode: params.isEditMode,
		mode: params.mode,
		selectedUserId: params.selectedUserId,
	});
	if (validationError) {
		toast.error(validationError);
		return 'validation-error';
	}

	if (params.isEditMode && params.student) {
		const result = await updateExistingStudent(params.student, params.form);
		if (result.ok === false) {
			showStudentSubmitError(result);
			return 'persist-error';
		}
		toast.success('Leerling bijgewerkt');
		return 'success';
	}

	const result = await createStudentRecord(params.form, params.mode, params.selectedUserId);
	if (result.ok === false) {
		showStudentSubmitError(result);
		return 'persist-error';
	}

	toast.success('Leerling aangemaakt', {
		description: `Leerling ${params.form.email} is succesvol aangemaakt.`,
	});
	return 'success';
}
