import { LGStep } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';

export function shouldLoadLessonGroupTeachers(lessonTypeId: string | null): lessonTypeId is string {
	return Boolean(lessonTypeId);
}

export function shouldLoadEligibleStudents(lessonTypeId: string | null): lessonTypeId is string {
	return Boolean(lessonTypeId);
}

export function shouldLoadPendingSignupRequests(lessonTypeId: string | null): lessonTypeId is string {
	return Boolean(lessonTypeId);
}

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
