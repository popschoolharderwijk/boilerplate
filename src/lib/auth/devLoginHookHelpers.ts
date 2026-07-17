import { DEV_ROLES, resolveStoredDevLoginValue } from '@/lib/auth/devLoginHelpers';

export function resolveDevLoginInitialValue(): string {
	if (typeof window === 'undefined') {
		return DEV_ROLES[0]?.email ?? 'site-admin@test.nl';
	}
	return resolveStoredDevLoginValue(
		localStorage.getItem('dev-login-selected-role'),
		localStorage.getItem('dev-login-selected-dev-user'),
	);
}

export function shouldBlockDevLoginInProduction(): boolean {
	return import.meta.env.MODE === 'production';
}

export function resolveDevLoginCredentials(
	email: string | null,
): { ok: true; email: string; password: string } | { ok: false; error: string } {
	if (!email) {
		return { ok: false, error: 'Selecteer eerst een rol, docent, leerling of user' };
	}

	const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
	if (!password) {
		return { ok: false, error: 'VITE_DEV_LOGIN_PASSWORD niet geconfigureerd in environment' };
	}

	return { ok: true, email, password };
}
export function resolveDevLoginButtonClass(isLocalDev: boolean): string {
	if (isLocalDev) {
		return 'bg-green-500/20 text-green-600 hover:bg-green-500/30 dark:text-green-400';
	}
	return 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 dark:text-orange-400';
}

export function resolveDevLoginButtonLabel(isLoading: boolean): string {
	if (isLoading) {
		return 'Inloggen...';
	}
	return 'Dev Login';
}
