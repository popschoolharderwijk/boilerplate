import { useEffect } from 'react';
import type { WizardFormState, WizardOptionSnapshot } from '@/components/agreements/wizard/wizardFormTypes';

interface LessonTypeOptionRow {
	id: string;
	duration_minutes: number;
	frequency: WizardOptionSnapshot['frequency'];
	price_per_lesson: number;
}

export function useWizardOptionPrefill(
	isEditMode: boolean,
	prefillOptionId: string | null,
	lessonTypeOptions: LessonTypeOptionRow[],
	setForm: React.Dispatch<React.SetStateAction<WizardFormState>>,
) {
	useEffect(() => {
		if (isEditMode || !prefillOptionId || lessonTypeOptions.length === 0) return;
		setForm((f) => {
			if (f.selectedOptionSnapshot) return f;
			const opt = lessonTypeOptions.find((o) => o.id === prefillOptionId);
			if (!opt) return f;
			return {
				...f,
				selectedOptionSnapshot: {
					duration_minutes: opt.duration_minutes,
					frequency: opt.frequency,
					price_per_lesson: opt.price_per_lesson,
				},
			};
		});
	}, [isEditMode, prefillOptionId, lessonTypeOptions, setForm]);
}
