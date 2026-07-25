export interface ParentContactInfo {
	parent_name: string | null;
	parent_email: string | null;
	parent_phone_number: string | null;
}

export function hasParentContactInfo(student: ParentContactInfo): boolean {
	return Boolean(student.parent_name || student.parent_email || student.parent_phone_number);
}

export function shouldRedirectMissingStudentProfile(params: {
	authLoading: boolean;
	user: unknown;
	profileLoaded: boolean;
	loading: boolean;
}): boolean {
	return Boolean(!params.authLoading && params.user && !params.profileLoaded && !params.loading);
}

export type MyStudentProfileView = 'redirect-missing' | 'skeleton' | 'redirect-empty' | 'content';

export function resolveMyStudentProfileView(params: {
	authLoading: boolean;
	loading: boolean;
	profile: unknown;
	redirectMissing: boolean;
}): MyStudentProfileView {
	if (params.redirectMissing) return 'redirect-missing';
	if (params.authLoading || params.loading) return 'skeleton';
	if (!params.profile) return 'redirect-empty';
	return 'content';
}
