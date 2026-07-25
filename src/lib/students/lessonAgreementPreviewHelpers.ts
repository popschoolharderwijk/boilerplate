import type { AgreementBillingPreview } from '@/hooks/useAgreementBillingPreview';

export type LessonAgreementPreviewViewState = 'loading' | 'error' | 'content' | 'empty';

export function resolveLessonAgreementPreviewViewState(
	loading: boolean,
	error: string | null,
	preview: AgreementBillingPreview | null,
): LessonAgreementPreviewViewState {
	if (loading) return 'loading';
	if (error) return 'error';
	if (preview) return 'content';
	return 'empty';
}

export function formatAgreementTariffLabel(tariff: AgreementBillingPreview['tariff']): string {
	return tariff === 'under_21' ? '< 21 jaar' : '21+ jaar';
}

export function shouldShowAgreementLeftoverNote(leftoverCents: number): boolean {
	return leftoverCents > 0;
}

export type LessonAgreementPreviewRenderKind = 'loading' | 'error' | 'content' | 'none';

export function resolveLessonAgreementPreviewRenderKind(
	viewState: LessonAgreementPreviewViewState,
	preview: AgreementBillingPreview | null,
): LessonAgreementPreviewRenderKind {
	if (viewState === 'loading') return 'loading';
	if (viewState === 'error') return 'error';
	if (viewState === 'content' && preview) return 'content';
	return 'none';
}
