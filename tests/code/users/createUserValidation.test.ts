import { describe, expect, it } from 'bun:test';
import {
	canAssignCreateUserRole,
	isDuplicateCreateUserError,
	isValidCreateUserEmail,
} from '../../../supabase/functions/_shared/create-user-validation';

describe('isValidCreateUserEmail', () => {
	it('accepts valid email addresses', () => {
		expect(isValidCreateUserEmail('user@example.com')).toBe(true);
	});

	it('rejects invalid email addresses', () => {
		expect(isValidCreateUserEmail('not-an-email')).toBe(false);
	});
});

describe('canAssignCreateUserRole', () => {
	it('allows site_admin to assign any role', () => {
		expect(canAssignCreateUserRole('site_admin', 'site_admin')).toBe(true);
		expect(canAssignCreateUserRole('site_admin', 'admin')).toBe(true);
	});

	it('blocks admin from assigning site_admin', () => {
		expect(canAssignCreateUserRole('admin', 'site_admin')).toBe(false);
	});

	it('allows admin to assign staff', () => {
		expect(canAssignCreateUserRole('admin', 'staff')).toBe(true);
	});

	it('rejects non-admin roles', () => {
		expect(canAssignCreateUserRole('teacher', 'staff')).toBe(false);
		expect(canAssignCreateUserRole(null, 'staff')).toBe(false);
	});
});

describe('isDuplicateCreateUserError', () => {
	it('detects duplicate user messages', () => {
		expect(isDuplicateCreateUserError('User already registered')).toBe(true);
		expect(isDuplicateCreateUserError('duplicate key value')).toBe(true);
	});

	it('returns false for other errors', () => {
		expect(isDuplicateCreateUserError('Invalid password')).toBe(false);
	});
});
