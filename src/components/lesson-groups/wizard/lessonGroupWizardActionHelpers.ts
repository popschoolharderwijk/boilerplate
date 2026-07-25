import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { saveLessonGroup } from '@/components/lesson-groups/wizard/lessonGroupSave';
import type { LessonGroupFormState } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';
import type { SlotWithStatus } from '@/lib/agreementSlots';

function isLessonGroupWizardFormComplete(form: LessonGroupFormState): boolean {
	return Boolean(form.name.trim() && form.lessonTypeId && form.teacherUserId && form.slot);
}

export function handleLessonGroupSlotClickState(
	slotStatus: 'free' | 'partial' | 'occupied',
): 'select' | 'open-partial' | 'ignore' {
	if (slotStatus === 'occupied') return 'ignore';
	if (slotStatus === 'partial') return 'open-partial';
	return 'select';
}

interface ExecuteLessonGroupWizardSaveParams {
	form: LessonGroupFormState;
	isEditMode: boolean;
	groupId: string | undefined;
	navigate: NavigateFunction;
	setSaving: (saving: boolean) => void;
}

export async function executeLessonGroupWizardSave(params: ExecuteLessonGroupWizardSaveParams): Promise<void> {
	if (!isLessonGroupWizardFormComplete(params.form)) {
		toast.error('Vul alle verplichte velden in');
		return;
	}
	params.setSaving(true);
	try {
		await saveLessonGroup({
			form: { ...params.form, lessonTypeId: params.form.lessonTypeId, teacherUserId: params.form.teacherUserId },
			slot: params.form.slot as SlotWithStatus,
			isEditMode: params.isEditMode,
			groupId: params.groupId,
		});
		toast.success(params.isEditMode ? 'Lesgroep bijgewerkt' : 'Lesgroep aangemaakt');
		params.navigate('/lesson-groups');
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Onbekende fout';
		toast.error('Opslaan mislukt', { description: msg });
	} finally {
		params.setSaving(false);
	}
}
