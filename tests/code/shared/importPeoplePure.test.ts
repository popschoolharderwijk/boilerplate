import { describe, expect, it } from 'bun:test';
import {
	buildLegacyStudentUpsertRow,
	buildUnknownLessonTypeLegacyIdError,
	findAuthUserIdInList,
	isDuplicateAuthUserError,
	matchesAuthUserEmail,
	normalizeLegacyParentEmail,
	parseLessonTypeLegacyIds,
	resolveAuthUserCreateFailureMessage,
	resolveCreatedAuthUserId,
	resolveLegacyTeacherImportOutcome,
	shouldLookupDuplicateAuthUser,
	shouldStopAuthUserPagination,
} from '../../../supabase/functions/import-legacy-data/importPeoplePure';

describe('parseLessonTypeLegacyIds', () => {
	it('returns an empty array for missing values', () => {
		expect(parseLessonTypeLegacyIds(undefined)).toEqual([]);
	});

	it('splits and trims pipe-separated legacy ids', () => {
		expect(parseLessonTypeLegacyIds(' lt-1 | lt-2| ')).toEqual(['lt-1', 'lt-2']);
	});
});

describe('buildUnknownLessonTypeLegacyIdError', () => {
	it('builds a row error for unknown lesson type legacy ids', () => {
		expect(buildUnknownLessonTypeLegacyIdError(3, 'lt-9')).toEqual({
			tab: 'teachers',
			row: 5,
			field: 'lesson_type_legacy_ids',
			message: 'Onbekend: lt-9',
		});
	});
});

describe('normalizeLegacyParentEmail', () => {
	it('returns null for blank parent emails', () => {
		expect(normalizeLegacyParentEmail('')).toBeNull();
	});

	it('returns the email when present', () => {
		expect(normalizeLegacyParentEmail('ouder@example.com')).toBe('ouder@example.com');
	});
});

describe('buildLegacyStudentUpsertRow', () => {
	it('maps nullable student import fields to database defaults', () => {
		expect(
			buildLegacyStudentUpsertRow({
				date_of_birth: null,
				parent_name: null,
				parent_email: '',
				parent_phone_number: null,
				debtor_info_same_as_student: null,
				debtor_name: null,
				debtor_address: null,
				debtor_postal_code: null,
				debtor_city: null,
			}),
		).toEqual({
			date_of_birth: null,
			parent_name: null,
			parent_email: null,
			parent_phone_number: null,
			debtor_info_same_as_student: true,
			debtor_name: null,
			debtor_address: null,
			debtor_postal_code: null,
			debtor_city: null,
		});
	});
});

describe('isDuplicateAuthUserError', () => {
	it('detects duplicate auth user messages', () => {
		expect(isDuplicateAuthUserError('User already registered')).toBe(true);
		expect(isDuplicateAuthUserError('Email exists')).toBe(true);
	});

	it('returns false for other auth errors', () => {
		expect(isDuplicateAuthUserError('Invalid password')).toBe(false);
	});
});

describe('matchesAuthUserEmail', () => {
	it('matches emails case-insensitively', () => {
		expect(matchesAuthUserEmail('Anna@Example.com', 'anna@example.com')).toBe(true);
	});

	it('returns false for different emails', () => {
		expect(matchesAuthUserEmail('other@example.com', 'anna@example.com')).toBe(false);
	});
});

describe('shouldStopAuthUserPagination', () => {
	it('returns true when the page is not full', () => {
		expect(shouldStopAuthUserPagination(500, 1000)).toBe(true);
	});

	it('returns false when the page is full', () => {
		expect(shouldStopAuthUserPagination(1000, 1000)).toBe(false);
	});
});

describe('findAuthUserIdInList', () => {
	it('returns the matching auth user id', () => {
		expect(
			findAuthUserIdInList(
				[
					{ id: 'user-1', email: 'Anna@Example.com' },
					{ id: 'user-2', email: 'other@example.com' },
				],
				'anna@example.com',
			),
		).toBe('user-1');
	});

	it('returns null when no user matches', () => {
		expect(findAuthUserIdInList([{ id: 'user-1', email: 'other@example.com' }], 'anna@example.com')).toBeNull();
	});
});

describe('resolveLegacyTeacherImportOutcome', () => {
	it('returns created when no mapping existed', () => {
		expect(resolveLegacyTeacherImportOutcome(false)).toBe('created');
	});

	it('returns updated when a mapping already existed', () => {
		expect(resolveLegacyTeacherImportOutcome(true)).toBe('updated');
	});
});

describe('shouldLookupDuplicateAuthUser', () => {
	it('returns true for duplicate auth user messages', () => {
		expect(shouldLookupDuplicateAuthUser('User already registered')).toBe(true);
	});

	it('returns false for other auth errors', () => {
		expect(shouldLookupDuplicateAuthUser('Invalid password')).toBe(false);
	});
});

describe('resolveCreatedAuthUserId', () => {
	it('returns the created auth user id', () => {
		expect(resolveCreatedAuthUserId({ user: { id: 'user-1' } })).toBe('user-1');
	});

	it('returns null when no user was created', () => {
		expect(resolveCreatedAuthUserId(null)).toBeNull();
	});
});

describe('resolveAuthUserCreateFailureMessage', () => {
	it('returns the original auth error message when present', () => {
		expect(resolveAuthUserCreateFailureMessage({ message: 'duplicate' }).message).toBe('duplicate');
	});

	it('returns a default error when auth error is missing', () => {
		expect(resolveAuthUserCreateFailureMessage(null).message).toBe('Gebruiker kon niet worden aangemaakt');
	});
});
