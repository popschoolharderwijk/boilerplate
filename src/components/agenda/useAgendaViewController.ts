import type { AgendaViewProps } from '@/components/agenda/AgendaView';
import { useAgendaViewModel } from '@/components/agenda/useAgendaViewModel';
import { useAuth } from '@/hooks/useAuth';
import { resolveAgendaViewAccess } from '@/lib/agenda/agendaViewAccessHelpers';

export function useAgendaViewController({ userId: viewUserId, canEdit: canEditProp }: AgendaViewProps = {}) {
	const { user, isPrivileged, isTeacher } = useAuth();
	const { effectiveUserId, canEdit, canManageAgenda } = resolveAgendaViewAccess({
		viewUserId,
		currentUserId: user?.id,
		canEditProp,
		isPrivileged,
		isTeacher,
		hasUser: !!user,
	});

	const viewModel = useAgendaViewModel({
		effectiveUserId,
		canEdit,
		canManageAgenda,
		isPrivileged,
		user: user ?? null,
	});

	return {
		...viewModel,
		canEdit,
		canManageAgenda,
		user: user ?? null,
	};
}
