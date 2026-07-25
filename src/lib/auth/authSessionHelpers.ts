import type { Session } from '@supabase/supabase-js';

export interface AuthSessionApplyPlan {
	userId: string | null;
	shouldFetchRoleAndTeacher: boolean;
	shouldClearRoleOnLogout: boolean;
}

export function planAuthSessionApply(session: Session | null, clearOnLogout: boolean): AuthSessionApplyPlan {
	const userId = session?.user?.id ?? null;
	return {
		userId,
		shouldFetchRoleAndTeacher: userId !== null,
		shouldClearRoleOnLogout: userId === null && clearOnLogout,
	};
}

export function runAuthSessionSideEffects(params: {
	plan: AuthSessionApplyPlan;
	fetchRole: (userId: string) => Promise<void>;
	fetchTeacher: (userId: string) => Promise<void>;
	clearRoleState: () => void;
	onLoadingComplete: () => void;
}): void {
	if (params.plan.shouldFetchRoleAndTeacher && params.plan.userId) {
		Promise.all([params.fetchRole(params.plan.userId), params.fetchTeacher(params.plan.userId)]).finally(
			params.onLoadingComplete,
		);
		return;
	}
	if (params.plan.shouldClearRoleOnLogout) {
		params.clearRoleState();
	}
	params.onLoadingComplete();
}
