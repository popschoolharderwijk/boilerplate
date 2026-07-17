import type { AppRole } from '@/lib/roles';

export type UserRoleUpdateAction = 'skip' | 'delete' | 'insert' | 'update';

export function resolveUserRoleUpdateAction(
	newRole: AppRole | null,
	currentRole: AppRole | null,
): UserRoleUpdateAction {
	if (newRole === currentRole) return 'skip';
	if (newRole === null) return 'delete';
	if (currentRole === null) return 'insert';
	return 'update';
}
