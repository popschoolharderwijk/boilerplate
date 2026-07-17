export function isIncassoInvitePrivilegedRole(role: string | null | undefined): boolean {
	return role === 'admin' || role === 'site_admin' || role === 'teacher';
}

export function canAccessIncassoInviteAgreement(
	isPrivileged: boolean,
	agreementStudentUserId: string,
	requestingUserId: string,
): boolean {
	return isPrivileged || agreementStudentUserId === requestingUserId;
}

export function buildIncassoInviteRedirectUrl(siteUrl: string, agreementId: string): string {
	return `${siteUrl}/incasso/start?agreement=${agreementId}`;
}

export function resolveIncassoInviteRecipient(profileEmail: string | null | undefined): string | null {
	return profileEmail ?? null;
}

export function resolveIncassoAgreementNotFoundResponse(): { status: 404; error: string } {
	return { status: 404, error: 'Overeenkomst niet gevonden' };
}

export function resolveIncassoAgreementInactiveResponse(): { status: 409; error: string } {
	return { status: 409, error: 'Overeenkomst is niet actief' };
}

export function resolveIncassoInviteForbiddenResponse(): { status: 403; error: string } {
	return { status: 403, error: 'Geen rechten' };
}

export function resolveIncassoInviteMissingEmailResponse(): { status: 422; error: string } {
	return { status: 422, error: 'Geen e-mailadres bekend voor leerling' };
}

export function buildIncassoInviteSuccessPayload(recipient: string): { ok: true; recipient: string } {
	return { ok: true, recipient };
}

export function hasIncassoAgreementRecord(
	agreement: { id: string; student_user_id: string; is_active: boolean } | null,
	error: unknown,
): agreement is { id: string; student_user_id: string; is_active: boolean } {
	return Boolean(agreement) && !error;
}

export function resolveIncassoAgreementAccessError(
	agreement: { id: string; is_active: boolean; student_user_id: string } | null,
	error: unknown,
	isPrivileged: boolean,
	userId: string,
):
	| { ok: false; status: number; error: string }
	| { ok: true; agreement: { id: string; is_active: boolean; student_user_id: string } } {
	if (!hasIncassoAgreementRecord(agreement, error)) {
		const notFound = resolveIncassoAgreementNotFoundResponse();
		return { ok: false, status: notFound.status, error: notFound.error };
	}
	if (!agreement.is_active) {
		const inactive = resolveIncassoAgreementInactiveResponse();
		return { ok: false, status: inactive.status, error: inactive.error };
	}
	if (!canAccessIncassoInviteAgreement(isPrivileged, agreement.student_user_id, userId)) {
		const forbidden = resolveIncassoInviteForbiddenResponse();
		return { ok: false, status: forbidden.status, error: forbidden.error };
	}
	return { ok: true, agreement };
}
