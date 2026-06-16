import { useCallback, useState } from 'react';
import type { CrudFormDialogActionsProps } from '@/components/ui/crud-form-dialog-actions';
import { useCrudDialogState } from './useCrudDialogState';

export function useFormCrudDialogState<TForm, TEntity>(emptyForm: TForm, toForm: (entity: TEntity) => TForm) {
	const crud = useCrudDialogState<TEntity>();
	const [form, setForm] = useState<TForm>(emptyForm);

	const openCreate = useCallback(() => {
		crud.openCreate(() => setForm(emptyForm));
	}, [crud, emptyForm]);

	const openEdit = useCallback(
		(entity: TEntity) => {
			crud.openEdit(entity, () => setForm(toForm(entity)));
		},
		[crud, toForm],
	);

	return {
		...crud,
		form,
		setForm,
		openCreate,
		openEdit,
	};
}

interface FormCrudDialogActionsOptions<TEntity> {
	isFormValid: boolean;
	onSave: () => void | Promise<void>;
	onDelete: () => void | Promise<void>;
	deleteTitle: string;
	getDeleteDescription: (entity: TEntity) => string;
}

export function useFormCrudDialogActions<TForm, TEntity>(
	crud: ReturnType<typeof useFormCrudDialogState<TForm, TEntity>>,
	options: FormCrudDialogActionsOptions<TEntity>,
): CrudFormDialogActionsProps {
	const { isFormValid, onSave, onDelete, deleteTitle, getDeleteDescription } = options;

	return {
		onCancel: () => crud.setDialogOpen(false),
		onSave,
		saving: crud.saving,
		disabled: !isFormValid,
		isEditing: !!crud.editing,
		deleteOpen: !!crud.deleteTarget,
		onDeleteOpenChange: (open) => !open && crud.setDeleteTarget(null),
		onDeleteConfirm: async () => {
			await onDelete();
		},
		deleteTitle,
		deleteDescription: crud.deleteTarget ? getDeleteDescription(crud.deleteTarget) : '',
	};
}
