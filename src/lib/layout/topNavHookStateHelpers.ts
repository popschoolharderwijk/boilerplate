import type { QuickNavItem } from '@/lib/layout/topNavHelpers';
import type { TopNavNavigationCallbacks } from '@/lib/layout/topNavHookHelpers';

export interface TopNavUserInitialsInput {
	first_name: string | null;
	last_name: string | null;
	email: string | null | undefined;
}

export interface TopNavHookState {
	open: boolean;
	setOpen: (open: boolean) => void;
	breadcrumbItems: { label: string; href?: string }[];
	quickNavItems: QuickNavItem[];
	displayName: string;
	email: string | null | undefined;
	roleLabel: string | null;
	userInitialsInput: TopNavUserInitialsInput;
	avatarUrl: string | null | undefined;
	resolvedTheme: string;
}

export function buildTopNavHookState(
	base: TopNavHookState,
	navigationCallbacks: TopNavNavigationCallbacks,
): TopNavHookState & TopNavNavigationCallbacks {
	return {
		...base,
		...navigationCallbacks,
	};
}
