import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { SignupRequestDetail } from '../../../src/components/students/SignupRequestDialog';
import {
	applyStudentsPageLoadOutcome,
	buildStudentsPageLoadRpcParams,
	executeStudentsPageLoad,
	getStudentDeleteSuccessMessage,
	resolveStudentDeleteToastKind,
	resolveStudentPageActionOutcome,
	resolveStudentRunAction,
	runStudentPageAction,
	type StudentsPageLoadOutcome,
} from '../../../src/lib/students/studentsPageControllerHelpers';

let rpcResult: { data: unknown; error: { message: string } | null } = {
	data: { data: [], total_count: 0 },
	error: null,
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		rpc: async () => rpcResult,
	},
}));

mock.module('../../../src/lib/signup-requests/signupRequestMappers', () => ({
	fetchSignupRequestsByEmails: async () => new Map<string, SignupRequestDetail[]>(),
}));

describe('resolveStudentRunAction', () => {
	it('maps student actions to controller steps', () => {
		expect(resolveStudentRunAction({ kind: 'edit' })).toBe('open-edit');
		expect(resolveStudentRunAction({ kind: 'delete' })).toBe('open-delete');
		expect(resolveStudentRunAction({ kind: 'confirm-delete' })).toBe('confirm-delete');
	});
});

describe('resolveStudentDeleteToastKind', () => {
	it('maps delete mode to toast kind', () => {
		expect(resolveStudentDeleteToastKind(true)).toBe('user-deleted');
		expect(resolveStudentDeleteToastKind(false)).toBe('agreements-deleted');
	});
});

describe('getStudentDeleteSuccessMessage', () => {
	it('returns user delete message when deleting user', () => {
		expect(getStudentDeleteSuccessMessage(true)).toBe('Leerling en gebruiker verwijderd');
	});

	it('returns agreements delete message when deleting agreements only', () => {
		expect(getStudentDeleteSuccessMessage(false)).toBe('Leerling verwijderd');
	});
});

describe('applyStudentsPageLoadOutcome', () => {
	it('applies success outcome and returns true', () => {
		let totalCount = 0;
		let appliedStudentCount = -1;
		const requests = new Map<string, SignupRequestDetail[]>();
		const outcome: StudentsPageLoadOutcome = {
			kind: 'success',
			students: [],
			totalCount: 12,
			requestsByEmail: requests,
		};
		const shouldStopLoading = applyStudentsPageLoadOutcome(
			outcome,
			(value) => {
				appliedStudentCount = value.length;
			},
			(value) => {
				totalCount = value;
			},
			(value) => {
				for (const [key, entry] of value.entries()) {
					requests.set(key, entry);
				}
			},
		);
		expect(shouldStopLoading).toBe(true);
		expect(totalCount).toBe(12);
		expect(appliedStudentCount).toBe(0);
	});

	it('returns false for skipped outcome', () => {
		expect(
			applyStudentsPageLoadOutcome(
				{ kind: 'skipped' },
				() => {},
				() => {},
				() => {},
			),
		).toBe(false);
	});
});

describe('buildStudentsPageLoadRpcParams', () => {
	it('maps list filters to rpc params', () => {
		expect(
			buildStudentsPageLoadRpcParams({
				authLoading: false,
				hasAccess: true,
				limit: 25,
				offset: 50,
				search: 'anna',
				statusFilter: 'active',
				lessonTypeId: 'lt-1',
				sortColumn: 'student',
				sortDirection: 'desc',
			}),
		).toEqual({
			p_limit: 25,
			p_offset: 50,
			p_search: 'anna',
			p_status: 'active',
			p_lesson_type_id: 'lt-1',
			p_sort_column: 'name',
			p_sort_direction: 'desc',
		});
	});
});

describe('resolveStudentPageActionOutcome', () => {
	const student = { user_id: 'student-1' } as never;

	it('maps edit action to open edit outcome', () => {
		expect(resolveStudentPageActionOutcome({ kind: 'edit', student }, null)).toEqual({
			kind: 'open-edit',
			student,
		});
	});

	it('maps delete action to open delete outcome', () => {
		expect(resolveStudentPageActionOutcome({ kind: 'delete', student }, null)).toEqual({
			kind: 'open-delete',
			student,
		});
	});

	it('maps confirm delete to execute delete outcome', () => {
		expect(
			resolveStudentPageActionOutcome({ kind: 'confirm-delete' }, { open: true, student, deleteUser: true }),
		).toEqual({
			kind: 'execute-delete',
			student,
			deleteUser: true,
		});
	});

	it('returns noop when confirm delete has no dialog state', () => {
		expect(resolveStudentPageActionOutcome({ kind: 'confirm-delete' }, null)).toEqual({ kind: 'noop' });
	});
});

describe('runStudentPageAction', () => {
	const student = { user_id: 'student-1', agreements: [] } as never;

	it('opens edit dialog for edit action', async () => {
		let openedStudent: unknown = null;
		await runStudentPageAction({ kind: 'edit', student }, null, {
			setStudentFormDialog: (value) => {
				openedStudent = value.student;
			},
			setDeleteDialog: () => {},
			loadStudents: () => {},
		});
		expect(openedStudent).toBe(student);
	});

	it('executes delete and reloads students for confirm delete', async () => {
		let dialogCleared = false;
		let studentsReloaded = false;
		await runStudentPageAction(
			{ kind: 'confirm-delete' },
			{ open: true, student, deleteUser: false },
			{
				setStudentFormDialog: () => {},
				setDeleteDialog: (value) => {
					dialogCleared = value === null;
				},
				loadStudents: () => {
					studentsReloaded = true;
				},
			},
		);
		expect(dialogCleared).toBe(true);
		expect(studentsReloaded).toBe(true);
	});
});

describe('executeStudentsPageLoad', () => {
	beforeEach(() => {
		rpcResult = {
			data: {
				data: [
					{
						user_id: 'student-1',
						email: 'student@example.com',
						active_agreements_count: 0,
						profile: {
							first_name: 'Anna',
							last_name: 'Jansen',
							email: 'student@example.com',
							avatar_url: null,
							phone_number: null,
						},
						agreements: [],
					},
				],
				total_count: 1,
			},
			error: null,
		};
	});

	it('returns skipped when auth is loading', async () => {
		expect(
			await executeStudentsPageLoad({
				authLoading: true,
				hasAccess: true,
				limit: 10,
				offset: 0,
				search: '',
				statusFilter: 'all',
				lessonTypeId: null,
				sortColumn: null,
				sortDirection: null,
			}),
		).toEqual({ kind: 'skipped' });
	});

	it('returns success with flattened students', async () => {
		const outcome = await executeStudentsPageLoad({
			authLoading: false,
			hasAccess: true,
			limit: 10,
			offset: 0,
			search: '',
			statusFilter: 'all',
			lessonTypeId: null,
			sortColumn: null,
			sortDirection: null,
		});
		expect(outcome.kind).toBe('success');
		if (outcome.kind === 'success') {
			expect(outcome.totalCount).toBe(1);
			expect(outcome.students).toHaveLength(1);
			expect(outcome.students[0]?.first_name).toBe('Anna');
		}
	});

	it('returns error when rpc fails', async () => {
		rpcResult = { data: null, error: { message: 'rpc failed' } };
		expect(
			await executeStudentsPageLoad({
				authLoading: false,
				hasAccess: true,
				limit: 10,
				offset: 0,
				search: '',
				statusFilter: 'all',
				lessonTypeId: null,
				sortColumn: null,
				sortDirection: null,
			}),
		).toEqual({ kind: 'error' });
	});
});
