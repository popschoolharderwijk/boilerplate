import { describe, expect, it } from 'bun:test';
import {
	buildUsersPageRowActions,
	createUsersPageRoleFilterSetter,
} from '../../../src/lib/users/usersPageShellHelpers';

describe('createUsersPageRoleFilterSetter', () => {
	it('updates selectedRole in filters', () => {
		let nextFilters: Record<string, unknown> = { selectedRole: null };
		const setFilters = (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
			nextFilters = updater(nextFilters);
		};
		const setter = createUsersPageRoleFilterSetter(setFilters);
		setter('staff');
		expect(nextFilters.selectedRole).toBe('staff');
	});
});

describe('buildUsersPageRowActions', () => {
	it('returns row actions for admins', () => {
		const actions = buildUsersPageRowActions({
			isAdmin: true,
			isSiteAdmin: false,
			currentUserId: 'user-1',
			onEdit: () => undefined,
			onDelete: () => undefined,
		});
		expect(actions?.onEdit).toBeDefined();
		expect(actions?.onDelete).toBeDefined();
		expect(actions?.render).toBeDefined();
	});
});
