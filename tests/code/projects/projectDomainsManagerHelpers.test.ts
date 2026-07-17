import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { PostgresErrorCodes } from '../../../src/integrations/supabase/errorcodes';

type QueryResult = { data: unknown; error: { code?: string; message: string } | null };

let domainsResult: QueryResult = { data: [], error: null };
let saveResult: QueryResult = { data: null, error: null };
let deleteResult: QueryResult = { data: [{ id: 'domain-1' }], error: null };

const supabaseMock = {
	from: (table: string) => {
		if (table === 'project_domains') {
			return {
				select: () => ({
					order: () => Promise.resolve(domainsResult),
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
			};
		}
		throw new Error(`Unexpected table ${table}`);
	},
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

describe('projectDomainsManagerHelpers', () => {
	let helpers: typeof import('../../../src/lib/projects/projectDomainsManagerHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/projects/projectDomainsManagerHelpers');
	});

	it('shouldBlockProjectDomainSave blocks empty name', () => {
		expect(helpers.shouldBlockProjectDomainSave('')).toBe(true);
		expect(helpers.shouldBlockProjectDomainSave('Muziek')).toBe(false);
	});

	it('resolveProjectDomainSaveOperation returns update when editing', () => {
		expect(helpers.resolveProjectDomainSaveOperation({ id: 'domain-1' })).toBe('update');
		expect(helpers.resolveProjectDomainSaveOperation(null)).toBe('create');
	});

	it('resolveProjectDomainDeleteOutcome maps delete results', () => {
		expect(helpers.resolveProjectDomainDeleteOutcome(null, [{ id: 'domain-1' }])).toBe('success');
		expect(
			helpers.resolveProjectDomainDeleteOutcome({ code: PostgresErrorCodes.FOREIGN_KEY_VIOLATION }, null),
		).toBe('error-linked');
		expect(helpers.resolveProjectDomainDeleteOutcome(null, [])).toBe('error-no-rights');
	});

	it('resolveProjectDomainDeleteNotDeletedDescription maps linked labels message', () => {
		expect(helpers.resolveProjectDomainDeleteNotDeletedDescription('error-linked')).toContain('labels');
		expect(helpers.resolveProjectDomainDeleteNotDeletedDescription('error-no-rights')).toContain('rechten');
	});
});

describe('projectDomainsManagerControllerHelpers', () => {
	let controller: typeof import('../../../src/lib/projects/projectDomainsManagerControllerHelpers');

	beforeAll(async () => {
		controller = await import('../../../src/lib/projects/projectDomainsManagerControllerHelpers');
	});

	beforeEach(() => {
		domainsResult = { data: [{ id: 'domain-1', name: 'Muziek' }], error: null };
		saveResult = { data: null, error: null };
		deleteResult = { data: [{ id: 'domain-1' }], error: null };
	});

	it('executeProjectDomainFetch returns domains on success', async () => {
		const outcome = await controller.executeProjectDomainFetch(supabaseMock as never);
		expect(outcome.kind).toBe('success');
		if (outcome.kind === 'success') {
			expect(outcome.domains).toHaveLength(1);
		}
	});

	it('executeProjectDomainSave returns blocked for empty name', async () => {
		const outcome = await controller.executeProjectDomainSave({
			name: '',
			editing: null,
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('blocked');
	});

	it('executeProjectDomainSave returns success on create', async () => {
		const outcome = await controller.executeProjectDomainSave({
			name: 'Dans',
			editing: null,
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('success');
	});

	it('executeProjectDomainDelete returns success when domain deleted', async () => {
		const outcome = await controller.executeProjectDomainDelete({
			deleteTarget: { id: 'domain-1', name: 'Muziek' } as never,
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('success');
	});

	it('executeProjectDomainDelete returns error-linked for foreign key violation', async () => {
		deleteResult = { data: null, error: { code: PostgresErrorCodes.FOREIGN_KEY_VIOLATION, message: 'fk' } };
		const outcome = await controller.executeProjectDomainDelete({
			deleteTarget: { id: 'domain-1', name: 'Muziek' } as never,
			supabase: supabaseMock as never,
		});
		expect(outcome).toBe('error-linked');
	});

	it('runProjectDomainSaveFlow closes dialog and refetches on success', async () => {
		let dialogOpen = true;
		let refetched = false;
		await controller.runProjectDomainSaveFlow({
			name: 'Dans',
			editing: null,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			fetchDomains: async () => {
				refetched = true;
			},
		});
		expect(dialogOpen).toBe(false);
		expect(refetched).toBe(true);
	});

	it('runProjectDomainDeleteFlow clears delete target and refetches', async () => {
		let deleteTarget: { id: string; name: string } | null = { id: 'domain-1', name: 'Muziek' };
		let refetched = false;
		await controller.runProjectDomainDeleteFlow({
			deleteTarget: deleteTarget as never,
			supabase: supabaseMock as never,
			setDeleteTarget: (target) => {
				deleteTarget = target;
			},
			fetchDomains: async () => {
				refetched = true;
			},
		});
		expect(deleteTarget).toBeNull();
		expect(refetched).toBe(true);
	});
});
