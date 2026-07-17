import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type QueryResult = { data: unknown; error: null };

const tableResults: Record<string, QueryResult> = {};

function thenableResult(table: string) {
	const result = tableResults[table] ?? { data: [], error: null };
	const promise = Promise.resolve(result);
	return Object.assign(promise, {
		select: () => thenableResult(table),
		eq: () => thenableResult(table),
		in: () => thenableResult(table),
	});
}

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: (table: string) => thenableResult(table),
	},
}));

describe('loadWizardTeachers', () => {
	let loadWizardTeachers: typeof import('../../../src/lib/agreements/loadWizardTeachers').loadWizardTeachers;

	beforeAll(async () => {
		({ loadWizardTeachers } = await import('../../../src/lib/agreements/loadWizardTeachers'));
	});

	beforeEach(() => {
		for (const key of Object.keys(tableResults)) {
			delete tableResults[key];
		}
	});

	it('returns an empty array when no teachers are linked to the lesson type', async () => {
		tableResults.teacher_lesson_types = { data: [], error: null };
		const result = await loadWizardTeachers('lt-1');
		expect(result).toEqual([]);
	});

	it('returns active teacher options for a lesson type', async () => {
		tableResults.teacher_lesson_types = { data: [{ teacher_user_id: 'teacher-1' }], error: null };
		tableResults.teachers = { data: [{ user_id: 'teacher-1' }], error: null };
		tableResults.profiles = {
			data: [
				{
					user_id: 'teacher-1',
					first_name: 'Piet',
					last_name: 'Docent',
					email: 'piet@example.com',
					avatar_url: null,
				},
			],
			error: null,
		};

		const result = await loadWizardTeachers('lt-1');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: 'teacher-1',
			userId: 'teacher-1',
			firstName: 'Piet',
			lastName: 'Docent',
			email: 'piet@example.com',
			avatarUrl: null,
		});
	});
});
