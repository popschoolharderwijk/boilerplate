import type { User } from '@/types/users';

export function mergeUsersIntoCache(prev: User[], users: User[]): User[] {
	const byId = new Map(prev.map((u) => [u.user_id, u]));
	for (const u of users) byId.set(u.user_id, u);
	return Array.from(byId.values());
}
