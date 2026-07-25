import { LGStep } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';

export function shouldLoadLessonGroupTeacherSlots(params: {
	step: LGStep;
	teacherUserId: string | null;
	startDate: string;
	endDate: string;
}): boolean {
	return Boolean(params.step === LGStep.Teacher && params.teacherUserId && params.startDate && params.endDate);
}

export function shouldLoadLessonGroupEditData(isEditMode: boolean, id: string | undefined): id is string {
	return isEditMode && Boolean(id);
}
