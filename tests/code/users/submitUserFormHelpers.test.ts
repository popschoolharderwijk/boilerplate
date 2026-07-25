import { describe, expect, it } from 'bun:test';
import { resolveUserRoleUpdateAction } from '../../../src/lib/users/submitUserFormHelpers';

describe('resolveUserRoleUpdateAction', () => {
	it('returns skip when roles are equal', () => {
		expect(resolveUserRoleUpdateAction('admin', 'admin')).toBe('skip');
	});

	it('returns delete when new role is null', () => {
		expect(resolveUserRoleUpdateAction(null, 'admin')).toBe('delete');
	});

	it('returns insert when current role is null', () => {
		expect(resolveUserRoleUpdateAction('staff', null)).toBe('insert');
	});

	it('returns update when both roles are set and different', () => {
		expect(resolveUserRoleUpdateAction('staff', 'admin')).toBe('update');
	});
});
