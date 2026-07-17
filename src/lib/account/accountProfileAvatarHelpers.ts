export function resolveAvatarImageSrc(avatarUrl: string | null | undefined): string | undefined {
	return avatarUrl || undefined;
}

export function getAvatarUploadInputId(): string {
	return 'avatar-upload';
}
