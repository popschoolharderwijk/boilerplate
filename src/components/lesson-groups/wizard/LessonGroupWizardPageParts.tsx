import { LessonGroupBasicsStep } from '@/components/lesson-groups/wizard/LessonGroupBasicsStep';
import { LessonGroupConfirmStep } from '@/components/lesson-groups/wizard/LessonGroupConfirmStep';
import { LessonGroupMembersStep } from '@/components/lesson-groups/wizard/LessonGroupMembersStep';
import { LessonGroupTeacherStep } from '@/components/lesson-groups/wizard/LessonGroupTeacherStep';
import { LGStep } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';
import type { useLessonGroupWizard } from '@/components/lesson-groups/wizard/useLessonGroupWizard';

export function LessonGroupStepBody({ wizard }: { wizard: ReturnType<typeof useLessonGroupWizard> }) {
	if (wizard.step === LGStep.Basics) return <LessonGroupBasicsStep wizard={wizard} />;
	if (wizard.step === LGStep.Teacher) return <LessonGroupTeacherStep wizard={wizard} />;
	if (wizard.step === LGStep.Members) return <LessonGroupMembersStep wizard={wizard} />;
	return <LessonGroupConfirmStep wizard={wizard} />;
}

export function resolveLessonGroupWizardTitle(isEditMode: boolean, formName: string): string {
	if (isEditMode) {
		return formName || 'Lesgroep bewerken';
	}
	return 'Nieuwe lesgroep';
}

export function resolveLessonGroupWizardSubtitle(isEditMode: boolean): string {
	if (isEditMode) {
		return 'Wijzig de groepsinstellingen';
	}
	return 'Stap voor stap een groepsles inplannen';
}
