export type LessonGroupWizardPageGate = 'loading' | 'denied' | 'ready';

export function shouldShowLessonGroupWizardLoading(pageGate: LessonGroupWizardPageGate): boolean {
	return pageGate === 'loading';
}

export function shouldRedirectLessonGroupWizard(pageGate: LessonGroupWizardPageGate): boolean {
	return pageGate === 'denied';
}

export function resolveLessonGroupWizardPageGate(
	authLoading: boolean,
	loading: boolean,
	canEdit: boolean,
): LessonGroupWizardPageGate {
	if (authLoading || loading) return 'loading';
	if (!canEdit) return 'denied';
	return 'ready';
}
