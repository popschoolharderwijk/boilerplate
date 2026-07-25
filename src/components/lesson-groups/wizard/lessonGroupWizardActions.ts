import type { Dispatch, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
	executeLessonGroupWizardSave,
	handleLessonGroupSlotClickState,
} from '@/components/lesson-groups/wizard/lessonGroupWizardActionHelpers';
import type { LessonGroupFormState } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';
import type { SlotWithStatus } from '@/lib/agreementSlots';

interface SaveLessonGroupWizardParams {
	form: LessonGroupFormState;
	isEditMode: boolean;
	groupId: string | undefined;
	navigate: NavigateFunction;
	setSaving: (saving: boolean) => void;
}

export function runLessonGroupWizardSave(params: SaveLessonGroupWizardParams): Promise<void> {
	return executeLessonGroupWizardSave(params);
}

export function handleLessonGroupSlotClick(
	slot: SlotWithStatus,
	setForm: Dispatch<SetStateAction<LessonGroupFormState>>,
	setPartialOpen: (open: boolean) => void,
): void {
	const clickState = handleLessonGroupSlotClickState(slot.status);
	if (clickState === 'ignore') return;
	setForm((f) => ({ ...f, slot }));
	if (clickState === 'open-partial') setPartialOpen(true);
}
