import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { PostgresErrorCodes } from '../../../src/integrations/supabase/errorcodes';
import type { ProjectDomain } from '../../../src/types/projects';

type QueryResult = { data: unknown; error: { code?: string; message: string } | null };

const mockDomain: ProjectDomain = {
	id: 'domain-1',
	name: 'Muziek',
	created_at: '2026-01-01T00:00:00Z',
	created_by: null,
	is_active: true,
	updated_at: '2026-01-01T00:00:00Z',
	updated_by: null,
};

let domainsResult: QueryResult = { data: [], error: null };
let saveResult: QueryResult = { data: null, error: null };
let deleteResult: QueryResult = { data: [{ id: 'domain-1' }], error: null };

const toastCalls: { kind: 'error' | 'success'; message: string; description?: string }[] = [];

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
		error: (message: string, options?: { description?: string }) => {
			toastCalls.push({ kind: 'error', message, description: options?.description });
		},
		success: (message: string) => {
			toastCalls.push({ kind: 'success', message });
		},
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
		domainsResult = { data: [mockDomain], error: null };
		saveResult = { data: null, error: null };
		deleteResult = { data: [{ id: 'domain-1' }], error: null };
		toastCalls.length = 0;
	});

	it('executeProjectDomainFetch returns domains on success', async () => {
		const outcome = await controller.executeProjectDomainFetch(supabaseMock as never);
		expect(outcome).toEqual({
			kind: 'success',
			domains: [mockDomain],
		});
	});

	it('runProjectDomainSaveFlow keeps dialog open for empty name', async () => {
		let dialogOpen = true;
		let refetched = false;
		await controller.runProjectDomainSaveFlow({
			name: '',
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
		expect(dialogOpen).toBe(true);
		expect(refetched).toBe(false);
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
		expect(toastCalls[0]?.message).toBe('Domein aangemaakt');
	});

	it('runProjectDomainDeleteFlow clears delete target and refetches on success', async () => {
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
		expect(toastCalls[0]?.message).toBe('Domein verwijderd');
	});

	it('runProjectDomainDeleteFlow shows linked labels toast for foreign key violation', async () => {
		deleteResult = { data: null, error: { code: PostgresErrorCodes.FOREIGN_KEY_VIOLATION, message: 'fk' } };
		await controller.runProjectDomainDeleteFlow({
			deleteTarget: { id: 'domain-1', name: 'Muziek' } as never,
			supabase: supabaseMock as never,
			setDeleteTarget: () => {},
			fetchDomains: async () => {},
		});
		expect(toastCalls[0]?.message).toBe('Domein niet verwijderd');
		expect(toastCalls[0]?.description).toContain('labels');
	});
});
