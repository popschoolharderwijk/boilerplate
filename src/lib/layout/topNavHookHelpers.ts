import type { NavigateFunction } from 'react-router-dom';
import { createThemeToggleHandler } from '@/components/layout/TopNavUserMenu';
import { getNextTheme } from '@/lib/layout/topNavHelpers';

export interface TopNavNavigationCallbacks {
	onNavigateProfile: () => void;
	onNavigateAppearance: () => void;
	onNavigateAccount: () => void;
	onSignOut: () => Promise<void>;
	onToggleTheme: () => void;
	onNavigate: NavigateFunction;
}

export function buildTopNavNavigationCallbacks(
	navigate: NavigateFunction,
	signOut: () => Promise<void>,
	resolvedTheme: string,
	setTheme: (theme: 'light' | 'dark') => void,
): TopNavNavigationCallbacks {
	return {
		onNavigateProfile: () => navigate('/account/profile'),
		onNavigateAppearance: () => navigate('/account/appearance'),
		onNavigateAccount: () => navigate('/account/danger'),
		onSignOut: async () => {
			await signOut();
			navigate('/login');
		},
		onToggleTheme: createThemeToggleHandler(resolvedTheme, setTheme),
		onNavigate: navigate,
	};
}

export function resolveTopNavNextTheme(resolvedTheme: string): 'light' | 'dark' {
	return getNextTheme(resolvedTheme);
}
