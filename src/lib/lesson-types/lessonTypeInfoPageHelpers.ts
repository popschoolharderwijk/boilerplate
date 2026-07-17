export function resolveLessonTypeInfoEditMode(id: string | undefined): boolean {
	return Boolean(id) && id !== 'new';
}

export function resolveLessonTypeInfoAccess(isAdmin: boolean, isSiteAdmin: boolean): boolean {
	return isAdmin || isSiteAdmin;
}

export function resolveLessonTypeTitle(
	formName: string,
	isEditMode: boolean,
	existingName: string | undefined,
): string {
	const trimmedName = formName.trim();
	if (trimmedName.length > 0) {
		return trimmedName;
	}
	if (isEditMode) {
		return existingName ?? 'Lessoort';
	}
	return 'Nieuwe lessoort';
}

export type LessonTypeInfoViewState = 'redirect' | 'loading' | 'content';

export function resolveLessonTypeInfoViewState(args: {
	authLoading: boolean;
	hasAccess: boolean;
	isEditMode: boolean;
	loading: boolean;
	id: string | undefined;
	hasLessonType: boolean;
}): LessonTypeInfoViewState {
	if (!args.authLoading && !args.hasAccess) return 'redirect';
	if (args.isEditMode && (args.loading || (Boolean(args.id) && !args.hasLessonType))) return 'loading';
	return 'content';
}
