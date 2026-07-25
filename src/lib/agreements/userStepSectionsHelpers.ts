import type { User } from '@/types/users';

export function hasDuplicateDuoPartner(
	partnerStudentUserId: string | null,
	selectedStudentUserId: string | null,
	partnerUser: User | null,
): boolean {
	return Boolean(partnerUser && selectedStudentUserId && partnerStudentUserId === selectedStudentUserId);
}

export function mapSelectedUserIds(user: User | null): { userId: string | null; user: User | null } {
	return {
		userId: user?.user_id ?? null,
		user,
	};
}
