export function filterAvatarFileNamesForUser(files: { name: string }[], userId: string): string[] {
	return files.filter((file) => file.name.startsWith(userId)).map((file) => file.name);
}
