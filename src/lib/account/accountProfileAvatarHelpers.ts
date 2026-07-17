export function resolveAvatarImageSrc(avatarUrl: string | null | undefined): string | undefined {
	return avatarUrl || undefined;
}

export function shouldShowAvatarDeleteButton(avatarUrl: string | null | undefined): boolean {
	return Boolean(avatarUrl);
}

export function getAvatarUploadInputId(): string {
	return 'avatar-upload';
}
