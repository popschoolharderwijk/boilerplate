import { useCallback, useEffect, useState } from 'react';
import {
	buildEmptyProjectFormState,
	loadProjectLabelOptions,
	mergeProjectFormLabelAfterLoad,
	type ProjectFormSaveInput,
	type ProjectLabelOption,
	resolveProjectFormDialogInitialState,
	runProjectFormDialogSubmit,
} from '@/lib/projects/projectFormDialogHelpers';

interface UseProjectFormDialogParams {
	open: boolean;
	project: {
		id: string;
		name: string;
		description: string | null;
		cost_center: string | null;
		is_active: boolean;
		owner_user_id: string;
		label_id: string;
	} | null;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
}

export function useProjectFormDialog({ open, project, onOpenChange, onSaved }: UseProjectFormDialogParams) {
	const isEditing = !!project;
	const [form, setForm] = useState<ProjectFormSaveInput & { id?: string }>(buildEmptyProjectFormState());
	const [labels, setLabels] = useState<ProjectLabelOption[]>([]);
	const [labelsLoading, setLabelsLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	const loadLabels = useCallback(async (currentLabelId?: string) => {
		setLabelsLoading(true);
		try {
			setLabels(await loadProjectLabelOptions(currentLabelId));
		} finally {
			setLabelsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!open) return;

		setForm(resolveProjectFormDialogInitialState(project));
		void loadLabels(project?.label_id).then(() => {
			if (project?.label_id) {
				setForm((prev) => mergeProjectFormLabelAfterLoad(prev, project.label_id));
			}
		});
	}, [open, project, loadLabels]);

	const setField = useCallback(<K extends keyof ProjectFormSaveInput>(key: K, value: ProjectFormSaveInput[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setSaving(true);
			try {
				await runProjectFormDialogSubmit({ form, isEditing, onOpenChange, onSaved });
			} finally {
				setSaving(false);
			}
		},
		[form, isEditing, onOpenChange, onSaved],
	);

	return {
		isEditing,
		form,
		labels,
		labelsLoading,
		saving,
		projectId: project?.id,
		setField,
		handleSubmit,
		onOpenChange,
	};
}

export type ProjectFormDialogViewModel = ReturnType<typeof useProjectFormDialog>;
