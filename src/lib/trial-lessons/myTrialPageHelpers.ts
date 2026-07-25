import type { MyTrialViewState } from '@/lib/trial-lessons/myTrialHelpers';

export type MyTrialPageGate = 'auth-loading' | 'unauthenticated' | 'ready';

export type MyTrialContentState = Exclude<MyTrialViewState, 'auth-loading' | 'unauthenticated'>;

export function resolveMyTrialPageGate(isAuthLoading: boolean, hasUser: boolean): MyTrialPageGate {
	if (isAuthLoading) return 'auth-loading';
	if (!hasUser) return 'unauthenticated';
	return 'ready';
}

export function resolveMyTrialContentState(loading: boolean, hasLatestTrial: boolean): MyTrialContentState {
	if (loading) return 'loading';
	if (!hasLatestTrial) return 'empty';
	return 'content';
}
