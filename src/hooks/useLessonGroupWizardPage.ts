import { useLessonGroupWizard } from '@/components/lesson-groups/wizard/useLessonGroupWizard';
import { resolveLessonGroupWizardPageGate } from '@/lib/lesson-groups/lessonGroupWizardShellHelpers';

export function useLessonGroupWizardPage() {
	const wizard = useLessonGroupWizard();
	const pageGate = resolveLessonGroupWizardPageGate(wizard.authLoading, wizard.loading, wizard.canEdit);

	return {
		wizard,
		pageGate,
		partialSlotHandlers: {
			onCancel: () => {
				wizard.setPartialOpen(false);
				wizard.clearSlot();
			},
			onConfirm: () => wizard.setPartialOpen(false),
		},
	};
}
