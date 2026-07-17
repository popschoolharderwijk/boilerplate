import { describe, expect, it } from 'bun:test';
import {
	resolveStudentInfoDateOfBirth,
	shouldRenderStudentInfoPrivilegedBlock,
	shouldShowStudentDateOfBirth,
	shouldShowStudentLimitedAccessNotice,
	shouldShowStudentPrivilegedSections,
} from '../../../src/lib/students/studentInfoModalBodyHelpers';

const fullData = {
	id: 'student-1',
	user_id: 'user-1',
	date_of_birth: '2010-01-01',
	parent_name: null,
	parent_email: null,
	parent_phone_number: null,
	debtor_info_same_as_student: true,
	debtor_name: null,
	debtor_address: null,
	debtor_postal_code: null,
	debtor_city: null,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	created_by: null,
	updated_by: null,
	email: 'student@example.com',
	first_name: 'Anna',
	last_name: 'Bakker',
	avatar_url: null,
	phone_number: null,
};

describe('shouldShowStudentDateOfBirth', () => {
	it('returns true when date of birth exists', () => {
		expect(shouldShowStudentDateOfBirth('2010-01-01')).toBe(true);
	});

	it('returns false when date of birth is missing', () => {
		expect(shouldShowStudentDateOfBirth(null)).toBe(false);
	});
});

describe('shouldShowStudentPrivilegedSections', () => {
	it('returns true for privileged viewers with full data', () => {
		expect(shouldShowStudentPrivilegedSections(true, fullData)).toBe(true);
	});

	it('returns false without full data', () => {
		expect(shouldShowStudentPrivilegedSections(true, null)).toBe(false);
	});

	it('returns false for non-privileged viewers', () => {
		expect(shouldShowStudentPrivilegedSections(false, fullData)).toBe(false);
	});
});

describe('shouldShowStudentLimitedAccessNotice', () => {
	it('returns true for non-privileged viewers', () => {
		expect(shouldShowStudentLimitedAccessNotice(false)).toBe(true);
	});

	it('returns false for privileged viewers', () => {
		expect(shouldShowStudentLimitedAccessNotice(true)).toBe(false);
	});
});

describe('resolveStudentInfoDateOfBirth', () => {
	it('returns date of birth from full data', () => {
		expect(resolveStudentInfoDateOfBirth(fullData)).toBe('2010-01-01');
	});

	it('returns null without full data', () => {
		expect(resolveStudentInfoDateOfBirth(null)).toBeNull();
	});
});

describe('shouldRenderStudentInfoPrivilegedBlock', () => {
	it('returns true for privileged viewers with full data', () => {
		expect(shouldRenderStudentInfoPrivilegedBlock(true, fullData)).toBe(true);
	});

	it('returns false without full data', () => {
		expect(shouldRenderStudentInfoPrivilegedBlock(true, null)).toBe(false);
	});
});
