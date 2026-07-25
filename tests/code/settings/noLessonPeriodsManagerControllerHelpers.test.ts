import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type QueryResult = { data: unknown; error: { message: string } | null };

let fetchResult: QueryResult = { data: [], error: null };
let saveResult: QueryResult = { data: null, error: null };
let deleteResult: QueryResult = { data: [{ id: 'period-1' }], error: null };

const supabaseMock = {
	from: () => ({
		select: () => ({
			order: () => Promise.resolve(fetchResult),
		}),
		update: () => ({
			eq: () => Promise.resolve(saveResult),
		}),
		insert: () => Promise.resolve(saveResult),
		delete: () => ({
			eq: () => ({
				select: () => Promise.resolve(deleteResult),
			}),
		}),
	}),
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

describe('noLessonPeriodsManagerControllerHelpers', () => {
	let helpers: typeof import('../../../src/lib/settings/noLessonPeriodsManagerControllerHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/settings/noLessonPeriodsManagerControllerHelpers');
	});

	beforeEach(() => {
		fetchResult = {
			data: [
				{ id: 'period-1', name: 'Kerst', start_date: '2026-12-20', end_date: '2026-12-31', description: null },
			],
			error: null,
		};
		saveResult = { data: null, error: null };
		deleteResult = { data: [{ id: 'period-1' }], error: null };
	});

	it('executeNoLessonPeriodFetch returns periods on success', async () => {
		const outcome = await helpers.executeNoLessonPeriodFetch(supabaseMock as never);
		expect(outcome).toEqual({
			kind: 'success',
			periods: [
				{ id: 'period-1', name: 'Kerst', start_date: '2026-12-20', end_date: '2026-12-31', description: null },
			],
		});
	});

	it('executeNoLessonPeriodFetch returns error on failure', async () => {
		fetchResult = { data: null, error: { message: 'denied' } };
		const outcome = await helpers.executeNoLessonPeriodFetch(supabaseMock as never);
		expect(outcome).toEqual({ kind: 'error' });
	});

	it('executeNoLessonPeriodSave returns blocked for invalid forms', async () => {
		const outcome = await helpers.executeNoLessonPeriodSave({
			isFormValid: false,
			form: { name: '', start_date: '', end_date: '', description: '' },
			editing: null,
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('blocked');
	});

	it('executeNoLessonPeriodSave returns success on create', async () => {
		const outcome = await helpers.executeNoLessonPeriodSave({
			isFormValid: true,
			form: { name: 'Kerst', start_date: '2026-12-20', end_date: '2026-12-31', description: '' },
			editing: null,
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('success');
	});

	it('executeNoLessonPeriodSave returns success on update', async () => {
		const outcome = await helpers.executeNoLessonPeriodSave({
			isFormValid: true,
			form: { name: 'Kerst', start_date: '2026-12-20', end_date: '2026-12-31', description: '' },
			editing: {
				id: 'period-1',
				name: 'Kerst',
				start_date: '2026-12-20',
				end_date: '2026-12-31',
				description: null,
			},
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('success');
	});

	it('executeNoLessonPeriodDelete returns success when rows deleted', async () => {
		const outcome = await helpers.executeNoLessonPeriodDelete({
			deleteTarget: {
				id: 'period-1',
				name: 'Kerst',
				start_date: '2026-12-20',
				end_date: '2026-12-31',
				description: null,
			},
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('success');
	});

	it('executeNoLessonPeriodDelete returns error when delete fails', async () => {
		deleteResult = { data: [], error: null };
		const outcome = await helpers.executeNoLessonPeriodDelete({
			deleteTarget: {
				id: 'period-1',
				name: 'Kerst',
				start_date: '2026-12-20',
				end_date: '2026-12-31',
				description: null,
			},
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('error');
	});
});
