export const EMAIL_OTP_TYPES = new Set(['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change']);

export function getSafeNext(value: string | null): string {
	if (!value?.startsWith('/') || value.startsWith('//')) return '/';
	return value;
}

export function isValidEmailOtpType(type: string): boolean {
	return EMAIL_OTP_TYPES.has(type);
}

export function resolveVerifyOtpErrorMessage(message: string): string {
	if (message.toLowerCase().includes('expired')) {
		return 'Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe link aan.';
	}
	return message;
}

export function resolveAuthConfirmParams(params: URLSearchParams): {
	tokenHash: string | null;
	typeParam: string;
	next: string;
	isValid: boolean;
} {
	const tokenHash = params.get('token_hash');
	const typeParam = params.get('type') ?? 'email';
	const next = getSafeNext(params.get('next'));
	const isValid = Boolean(tokenHash) && isValidEmailOtpType(typeParam);

	return { tokenHash, typeParam, next, isValid };
}
