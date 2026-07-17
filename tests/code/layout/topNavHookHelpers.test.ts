import { describe, expect, it } from 'bun:test';
import { buildTopNavNavigationCallbacks, resolveTopNavNextTheme } from '../../../src/lib/layout/topNavHookHelpers';

describe('buildTopNavNavigationCallbacks', () => {
	it('builds navigation callbacks with profile and account routes', async () => {
		const navigated: string[] = [];
		const navigate = ((path: string) => {
			navigated.push(path);
		}) as never;
		let signedOut = false;
		const state = { theme: 'light' as 'light' | 'dark' };

		const callbacks = buildTopNavNavigationCallbacks(
			navigate,
			async () => {
				signedOut = true;
			},
			'light',
			(nextTheme: 'light' | 'dark') => {
				state.theme = nextTheme;
			},
		);

		callbacks.onNavigateProfile();
		callbacks.onNavigateAppearance();
		callbacks.onNavigateAccount();
		await callbacks.onSignOut();
		callbacks.onToggleTheme();

		expect(navigated).toEqual(['/account/profile', '/account/appearance', '/account/danger', '/login']);
		expect(signedOut).toBe(true);
		expect(state.theme).toBe('dark');
	});
});

describe('resolveTopNavNextTheme', () => {
	it('returns light when current theme is dark', () => {
		expect(resolveTopNavNextTheme('dark')).toBe('light');
	});

	it('returns dark when current theme is light', () => {
		expect(resolveTopNavNextTheme('light')).toBe('dark');
	});
});
