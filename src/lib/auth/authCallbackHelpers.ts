export type AuthCallbackOutcome = { kind: 'error'; message: string } | { kind: 'success' };

export interface AuthCallbackDeps {
	readHashError: () => string | null;
	getLocationHref: () => string;
	getLocationHash: () => string;
	verifyOtp: (tokenHash: string) => Promise<{ error: { message: string } | null }>;
	exchangeCodeForSession: (href: string) => Promise<{ error: { message: string } | null }>;
}

export function isValidAuthCallbackTokenHash(tokenHash: string | null, type: string): boolean {
	return Boolean(tokenHash) && type === 'email';
}

export function parseAuthCallbackHashParams(hash: string): { tokenHash: string | null; type: string } {
	const hashParams = new URLSearchParams(hash.slice(1));
	return {
		tokenHash: hashParams.get('token_hash'),
		type: hashParams.get('type') ?? 'email',
	};
}

export async function runAuthCallback(deps: AuthCallbackDeps): Promise<AuthCallbackOutcome> {
	const hashError = deps.readHashError();
	if (hashError) {
		return { kind: 'error', message: hashError };
	}

	const hash = deps.getLocationHash();
	if (hash.includes('token_hash=')) {
		const { tokenHash, type } = parseAuthCallbackHashParams(hash);
		if (!isValidAuthCallbackTokenHash(tokenHash, type)) {
			return { kind: 'error', message: 'Ongeldige inloglink. Vraag een nieuwe link aan.' };
		}
		const { error } = await deps.verifyOtp(tokenHash as string);
		if (error) {
			return { kind: 'error', message: error.message };
		}
		return { kind: 'success' };
	}

	const { error } = await deps.exchangeCodeForSession(deps.getLocationHref());
	if (error) {
		return { kind: 'error', message: error.message };
	}
	return { kind: 'success' };
}
