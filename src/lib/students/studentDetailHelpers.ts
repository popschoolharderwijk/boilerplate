import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import type { LessonAgreementWithTeacher } from '@/types/lesson-agreements';

export interface StudentProfileData {
	user_id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
	avatar_url: string | null;
}

export function buildStudentInitials(profile: StudentProfileData): string {
	return (profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '');
}

export function buildStudentAvatarFallback(profile: StudentProfileData, initials: string): string {
	return initials.toUpperCase() || profile.email.slice(0, 2).toUpperCase();
}

export function formatStudentPhoneSubtitle(email: string, phoneNumber: string | null): string {
	return phoneNumber ? `${email} · ${phoneNumber}` : email;
}

export type StudentDetailViewState = 'redirect' | 'loading' | 'not-found' | 'content';

export function resolveStudentDetailViewState(
	authLoading: boolean,
	canView: boolean,
	loading: boolean,
	hasProfile: boolean,
): StudentDetailViewState {
	if (!authLoading && !canView) return 'redirect';
	if (loading || authLoading) return 'loading';
	if (!hasProfile) return 'not-found';
	return 'content';
}

export function resolveStudentDetailRedirectPath(viewState: StudentDetailViewState): string | null {
	if (viewState === 'redirect') return '/';
	if (viewState === 'not-found') return '/students';
	return null;
}

export type StudentDetailRenderTarget = '/' | '/students' | 'loading' | 'content';

export function resolveStudentDetailRenderTarget(
	viewState: StudentDetailViewState,
	hasProfile: boolean,
): StudentDetailRenderTarget {
	const redirectPath = resolveStudentDetailRedirectPath(viewState);
	if (redirectPath === '/') return '/';
	if (redirectPath === '/students') return '/students';
	if (viewState === 'loading') return 'loading';
	if (!hasProfile) return '/students';
	return 'content';
}

export type StudentDetailPageContent =
	| { kind: 'loading' }
	| { kind: 'redirect'; to: '/' | '/students' }
	| {
			kind: 'body';
			profile: StudentProfileData;
			userId: string;
			agreements: LessonAgreementWithTeacher[];
			signupRequests: SignupRequestDetail[];
	  };

export function resolveStudentDetailPageContent(args: {
	authLoading: boolean;
	canView: boolean;
	loading: boolean;
	profile: StudentProfileData | null;
	userId: string | undefined;
	agreements: LessonAgreementWithTeacher[];
	signupRequests: SignupRequestDetail[];
}): StudentDetailPageContent {
	const viewState = resolveStudentDetailViewState(
		args.authLoading,
		args.canView,
		args.loading,
		Boolean(args.profile),
	);
	const renderTarget = resolveStudentDetailRenderTarget(viewState, Boolean(args.profile));

	if (renderTarget === 'loading') return { kind: 'loading' };
	if (renderTarget === '/') return { kind: 'redirect', to: '/' };
	if (renderTarget === '/students') return { kind: 'redirect', to: '/students' };
	if (!args.profile || !args.userId) return { kind: 'redirect', to: '/students' };

	return {
		kind: 'body',
		profile: args.profile,
		userId: args.userId,
		agreements: args.agreements,
		signupRequests: args.signupRequests,
	};
}
