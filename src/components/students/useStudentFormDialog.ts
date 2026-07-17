import { useCallback, useEffect, useState } from 'react';
import { getStudentFormDialogCopy } from '@/components/students/studentFormDialogCopy';
import { executeStudentFormSubmit } from '@/components/students/studentFormSubmitHelpers';
import {
	emptyStudentForm,
	type StudentFormState,
	studentFormFromStudent,
} from '@/components/students/studentFormTypes';
import { useStudentFormMode } from '@/components/students/useStudentFormMode';
import type { Student } from '@/types/students';

interface UseStudentFormDialogParams {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	student?: Student;
}

export function useStudentFormDialog({ open, onOpenChange, onSuccess, student }: UseStudentFormDialogParams) {
	const isEditMode = !!student;
	const [form, setForm] = useState<StudentFormState>(emptyStudentForm);
	const [saving, setSaving] = useState(false);
	const { mode, selectedUserId, resetMode, selectExistingUser, switchToNewUserMode, switchToExistingUserMode } =
		useStudentFormMode();

	useEffect(() => {
		if (!open) return;
		setForm(student ? studentFormFromStudent(student) : emptyStudentForm);
		resetMode();
	}, [open, resetMode, student]);

	const resetDialog = useCallback(() => {
		setForm(emptyStudentForm);
		resetMode();
	}, [resetMode]);

	const finishSuccess = useCallback(() => {
		resetDialog();
		onOpenChange(false);
		onSuccess();
	}, [onOpenChange, onSuccess, resetDialog]);

	const runFormAction = useCallback(async () => {
		setSaving(true);
		try {
			const outcome = await executeStudentFormSubmit({
				form,
				isEditMode,
				mode,
				selectedUserId,
				student,
			});
			if (outcome === 'success') finishSuccess();
		} finally {
			setSaving(false);
		}
	}, [finishSuccess, form, isEditMode, mode, selectedUserId, student]);

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (saving) return;
			if (!newOpen) resetDialog();
			onOpenChange(newOpen);
		},
		[onOpenChange, resetDialog, saving],
	);

	const handleCancel = useCallback(() => {
		if (saving) return;
		resetDialog();
		onOpenChange(false);
	}, [onOpenChange, resetDialog, saving]);

	const clearEmail = useCallback(() => {
		setForm((current) => ({ ...current, email: '' }));
	}, []);

	const copy = getStudentFormDialogCopy(isEditMode, form.first_name, form.email);

	return {
		form,
		setForm,
		saving,
		mode,
		isEditMode,
		selectedUserId,
		runFormAction,
		handleOpenChange,
		handleCancel,
		selectExistingUser: (userId: string | null) =>
			selectExistingUser(userId, (email) => setForm({ ...emptyStudentForm, email })),
		switchToNewUserMode: () => switchToNewUserMode(clearEmail),
		switchToExistingUserMode: () => switchToExistingUserMode(clearEmail),
		...copy,
	};
}

export type StudentFormDialogViewModel = ReturnType<typeof useStudentFormDialog>;
