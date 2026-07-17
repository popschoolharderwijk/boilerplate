import type { EnrichedTrialLessonStudent } from '@/lib/trial-lessons/enrichTrialLessons';
import type { MyTrialContentState } from '@/lib/trial-lessons/myTrialPageHelpers';

export function shouldRenderMyTrialCard(
	contentState: MyTrialContentState,
	latest: EnrichedTrialLessonStudent | undefined,
): latest is EnrichedTrialLessonStudent {
	return contentState === 'content' && latest !== undefined;
}
