import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type TableResult = { data?: unknown; error?: { message: string } | null };

type RecordedCall =
	| { kind: 'insert'; table: string; payload: unknown }
	| { kind: 'delete'; table: string; filters: Record<string, unknown> }
	| { kind: 'update'; table: string; payload: unknown; filters: Record<string, unknown> };

const recordedCalls: RecordedCall[] = [];
let tableResults: Record<string, TableResult> = {};

function resolveResult(table: string, kind: string): TableResult {
	return tableResults[`${table}:${kind}`] ?? { error: null };
}

function createQueryBuilder(table: string) {
	let operation = '';
	let payload: unknown;
	const filters: Record<string, unknown> = {};

	const execute = (): TableResult => {
		switch (operation) {
			case 'select':
				return resolveResult(table, 'select');
			case 'insert':
				recordedCalls.push({ kind: 'insert', table, payload });
				return resolveResult(table, 'insert');
			case 'delete':
				recordedCalls.push({ kind: 'delete', table, filters });
				return resolveResult(table, 'delete');
			case 'update':
				recordedCalls.push({ kind: 'update', table, payload, filters });
				return resolveResult(table, 'update');
			default:
				return { error: null };
		}
	};

	class QueryBuilder implements PromiseLike<TableResult> {
		select(_cols?: string) {
			if (operation !== 'insert') {
				operation = 'select';
			}
			return this;
		}
		insert(nextPayload: unknown) {
			operation = 'insert';
			payload = nextPayload;
			return this;
		}
		delete() {
			operation = 'delete';
			return this;
		}
		update(nextPayload: unknown) {
			operation = 'update';
			payload = nextPayload;
			return this;
		}
		eq(col: string, val: unknown) {
			filters[col] = val;
			return this;
		}
		in(col: string, val: unknown) {
			filters[col] = val;
			return this;
		}
		single() {
			return Promise.resolve(execute());
		}
		// biome-ignore lint/suspicious/noThenProperty: supabase query builder mock
		then<TResult1 = TableResult, TResult2 = never>(
			onFulfilled?: ((value: TableResult) => TResult1 | PromiseLike<TResult1>) | null,
			onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
		) {
			return Promise.resolve(execute()).then(onFulfilled, onRejected);
		}
	}

	return new QueryBuilder();
}

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: (table: string) => createQueryBuilder(table),
	},
}));

describe('teacherFormDialogActions', () => {
	let actions: typeof import('../../../src/lib/teachers/teacherFormDialogActions');

	beforeAll(async () => {
		actions = await import('../../../src/lib/teachers/teacherFormDialogActions');
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
		tableResults['teacher_lesson_types:select'] = {
			data: [{ lesson_type_id: 'lt-1' }],
			error: null,
		};
	});

	it('updates teacher profile fields', async () => {
		const error = await actions.updateTeacherProfileFields('teacher-1', {
			email: 'piet@example.com',
			first_name: 'Piet',
			last_name: 'Docent',
			phone_number: '0612345678',
			bio: '',
			lesson_type_ids: [],
		});
		expect(error).toBeNull();
		expect(recordedCalls).toEqual([
			{
				kind: 'update',
				table: 'profiles',
				payload: {
					first_name: 'Piet',
					last_name: 'Docent',
					phone_number: '0612345678',
				},
				filters: { user_id: 'teacher-1' },
			},
		]);
	});

	it('returns profile update error message', async () => {
		tableResults['profiles:update'] = { error: { message: 'profile failed' } };
		const error = await actions.updateTeacherProfileFields('teacher-1', {
			email: '',
			first_name: '',
			last_name: '',
			phone_number: '',
			bio: '',
			lesson_type_ids: [],
		});
		expect(error).toBe('profile failed');
	});

	it('creates teacher record and returns user id', async () => {
		tableResults['teachers:insert'] = { data: { user_id: 'teacher-1' }, error: null };
		const result = await actions.createTeacherRecord('teacher-1', {
			email: '',
			first_name: '',
			last_name: '',
			phone_number: '',
			bio: 'Bio text',
			lesson_type_ids: [],
		});
		expect(result).toEqual({ user_id: 'teacher-1' });
	});

	it('returns null when teacher insert fails', async () => {
		tableResults['teachers:insert'] = { error: { message: 'insert failed' } };
		const result = await actions.createTeacherRecord('teacher-1', {
			email: '',
			first_name: '',
			last_name: '',
			phone_number: '',
			bio: '',
			lesson_type_ids: [],
		});
		expect(result).toBeNull();
	});

	it('returns null when linking zero lesson types', async () => {
		const error = await actions.linkTeacherLessonTypes('teacher-1', []);
		expect(error).toBeNull();
		expect(recordedCalls).toHaveLength(0);
	});

	it('returns insert error when linking lesson types fails', async () => {
		tableResults['teacher_lesson_types:insert'] = { error: { message: 'link failed' } };
		const error = await actions.linkTeacherLessonTypes('teacher-1', ['lt-1']);
		expect(error).toBe('link failed');
	});

	it('updates teacher bio', async () => {
		const error = await actions.updateTeacherBio('teacher-1', 'Updated bio');
		expect(error).toBeNull();
		expect(recordedCalls[0]).toEqual({
			kind: 'update',
			table: 'teachers',
			payload: { bio: 'Updated bio' },
			filters: { user_id: 'teacher-1' },
		});
	});
});

describe('syncTeacherLessonTypes', () => {
	let syncTeacherLessonTypes: typeof import('../../../src/lib/teachers/teacherFormDialogActions').syncTeacherLessonTypes;

	beforeAll(async () => {
		({ syncTeacherLessonTypes } = await import('../../../src/lib/teachers/teacherFormDialogActions'));
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
		tableResults['teacher_lesson_types:select'] = {
			data: [{ lesson_type_id: 'lt-1' }],
			error: null,
		};
	});

	it('adds and removes lesson type links when selection changes', async () => {
		const result = await syncTeacherLessonTypes('teacher-1', ['lt-2']);
		expect(result).toEqual({ addError: null, removeError: null });
		expect(recordedCalls).toEqual([
			{
				kind: 'insert',
				table: 'teacher_lesson_types',
				payload: [{ teacher_user_id: 'teacher-1', lesson_type_id: 'lt-2' }],
			},
			{
				kind: 'delete',
				table: 'teacher_lesson_types',
				filters: { teacher_user_id: 'teacher-1', lesson_type_id: ['lt-1'] },
			},
		]);
	});

	it('returns no db calls when lesson type selection is unchanged', async () => {
		const result = await syncTeacherLessonTypes('teacher-1', ['lt-1']);
		expect(result).toEqual({ addError: null, removeError: null });
		expect(recordedCalls).toHaveLength(0);
	});

	it('returns insert error when adding links fails', async () => {
		tableResults['teacher_lesson_types:select'] = { data: [], error: null };
		tableResults['teacher_lesson_types:insert'] = { error: { message: 'insert failed' } };
		const result = await syncTeacherLessonTypes('teacher-1', ['lt-1']);
		expect(result).toEqual({ addError: 'insert failed', removeError: null });
	});

	it('returns remove error when deleting links fails', async () => {
		tableResults['teacher_lesson_types:delete'] = { error: { message: 'delete failed' } };
		const result = await syncTeacherLessonTypes('teacher-1', []);
		expect(result).toEqual({ addError: null, removeError: 'delete failed' });
	});
});
