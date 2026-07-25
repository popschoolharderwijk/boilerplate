import { describe, expect, it } from 'bun:test';
import {
	buildIncassoInviteRedirectUrl,
	buildIncassoInviteSuccessPayload,
	canAccessIncassoInviteAgreement,
	hasIncassoAgreementRecord,
	isIncassoInvitePrivilegedRole,
	resolveIncassoAgreementAccessError,
	resolveIncassoAgreementInactiveResponse,
	resolveIncassoAgreementNotFoundResponse,
	resolveIncassoInviteForbiddenResponse,
	resolveIncassoInviteMissingEmailResponse,
	resolveIncassoInviteRecipient,
} from '../../../supabase/functions/send-incasso-invite/sendIncassoInvitePure';

const AGREEMENT_ID = '11111111-1111-1111-1111-111111111111';
const STUDENT_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_USER_ID = '33333333-3333-3333-3333-333333333333';

describe('isIncassoInvitePrivilegedRole', () => {
	it('returns true for admin, site_admin and teacher roles', () => {
		expect(isIncassoInvitePrivilegedRole('admin')).toBe(true);
		expect(isIncassoInvitePrivilegedRole('site_admin')).toBe(true);
		expect(isIncassoInvitePrivilegedRole('teacher')).toBe(true);
	});

	it('returns false for student and missing roles', () => {
		expect(isIncassoInvitePrivilegedRole('student')).toBe(false);
		expect(isIncassoInvitePrivilegedRole(null)).toBe(false);
	});
});

describe('canAccessIncassoInviteAgreement', () => {
	it('allows privileged users to access any agreement', () => {
		expect(canAccessIncassoInviteAgreement(true, STUDENT_ID, OTHER_USER_ID)).toBe(true);
	});

	it('allows the student owner to access their own agreement', () => {
		expect(canAccessIncassoInviteAgreement(false, STUDENT_ID, STUDENT_ID)).toBe(true);
	});

	it('denies non-privileged users for other students', () => {
		expect(canAccessIncassoInviteAgreement(false, STUDENT_ID, OTHER_USER_ID)).toBe(false);
	});
});

describe('buildIncassoInviteRedirectUrl', () => {
	it('builds the incasso start redirect url', () => {
		expect(buildIncassoInviteRedirectUrl('https://app.example.com', AGREEMENT_ID)).toBe(
			`https://app.example.com/incasso/start?agreement=${AGREEMENT_ID}`,
		);
	});
});

describe('resolveIncassoInviteRecipient', () => {
	it('returns the profile email when present', () => {
		expect(resolveIncassoInviteRecipient('student@example.com')).toBe('student@example.com');
	});

	it('returns null when the profile email is missing', () => {
		expect(resolveIncassoInviteRecipient(null)).toBeNull();
	});
});

describe('resolveIncassoAgreementNotFoundResponse', () => {
	it('returns the not found payload', () => {
		expect(resolveIncassoAgreementNotFoundResponse()).toEqual({
			status: 404,
			error: 'Overeenkomst niet gevonden',
		});
	});
});

describe('resolveIncassoAgreementAccessError', () => {
	const agreement = {
		id: AGREEMENT_ID,
		student_user_id: STUDENT_ID,
		is_active: true,
	};

	it('returns ok when access is allowed', () => {
		expect(resolveIncassoAgreementAccessError(agreement, null, true, OTHER_USER_ID)).toEqual({
			ok: true,
			agreement,
		});
	});

	it('returns not found when agreement is missing', () => {
		expect(resolveIncassoAgreementAccessError(null, null, true, OTHER_USER_ID)).toEqual({
			ok: false,
			status: 404,
			error: 'Overeenkomst niet gevonden',
		});
	});

	it('returns inactive when agreement is not active', () => {
		expect(
			resolveIncassoAgreementAccessError({ ...agreement, is_active: false }, null, true, OTHER_USER_ID),
		).toEqual({
			ok: false,
			status: 409,
			error: 'Overeenkomst is niet actief',
		});
	});

	it('returns forbidden for non-privileged users on other students', () => {
		expect(resolveIncassoAgreementAccessError(agreement, null, false, OTHER_USER_ID)).toEqual({
			ok: false,
			status: 403,
			error: 'Geen rechten',
		});
	});
});

describe('resolveIncassoAgreementInactiveResponse', () => {
	it('returns the inactive payload', () => {
		expect(resolveIncassoAgreementInactiveResponse()).toEqual({
			status: 409,
			error: 'Overeenkomst is niet actief',
		});
	});
});

describe('resolveIncassoInviteForbiddenResponse', () => {
	it('returns the forbidden payload', () => {
		expect(resolveIncassoInviteForbiddenResponse()).toEqual({ status: 403, error: 'Geen rechten' });
	});
});

describe('resolveIncassoInviteMissingEmailResponse', () => {
	it('returns the missing email payload', () => {
		expect(resolveIncassoInviteMissingEmailResponse()).toEqual({
			status: 422,
			error: 'Geen e-mailadres bekend voor leerling',
		});
	});
});

describe('buildIncassoInviteSuccessPayload', () => {
	it('returns the success payload', () => {
		expect(buildIncassoInviteSuccessPayload('student@example.com')).toEqual({
			ok: true,
			recipient: 'student@example.com',
		});
	});
});

describe('hasIncassoAgreementRecord', () => {
	it('returns true when agreement exists without error', () => {
		expect(
			hasIncassoAgreementRecord({ id: AGREEMENT_ID, student_user_id: STUDENT_ID, is_active: true }, null),
		).toBe(true);
	});

	it('returns false when agreement is missing', () => {
		expect(hasIncassoAgreementRecord(null, null)).toBe(false);
	});
});
