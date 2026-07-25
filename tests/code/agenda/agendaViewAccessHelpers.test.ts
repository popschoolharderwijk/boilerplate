import { describe, expect, it } from 'bun:test';
import { resolveAgendaViewAccess } from '../../../src/lib/agenda/agendaViewAccessHelpers';

describe('resolveAgendaViewAccess', () => {
	it('uses the current user when no view user is provided', () => {
		expect(
			resolveAgendaViewAccess({
				viewUserId: undefined,
				currentUserId: 'user-1',
				canEditProp: undefined,
				isPrivileged: false,
				isTeacher: true,
				hasUser: true,
			}),
		).toEqual({
			effectiveUserId: 'user-1',
			canEdit: true,
			canManageAgenda: true,
		});
	});

	it('respects explicit canEdit override', () => {
		expect(
			resolveAgendaViewAccess({
				viewUserId: 'student-1',
				currentUserId: 'admin-1',
				canEditProp: false,
				isPrivileged: true,
				isTeacher: false,
				hasUser: true,
			}),
		).toEqual({
			effectiveUserId: 'student-1',
			canEdit: false,
			canManageAgenda: true,
		});
	});
});
