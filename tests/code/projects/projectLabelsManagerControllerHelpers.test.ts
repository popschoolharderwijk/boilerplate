import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { PostgresErrorCodes } from '../../../src/integrations/supabase/errorcodes';

type QueryResult = { data: unknown; error: { code?: string; message: string } | null };

let labelsResult: QueryResult = { data: [], error: null };
let domainsResult: QueryResult = { data: [], error: null };
let linkedProjectsResult: QueryResult = { data: [], error: null };
let saveResult: QueryResult = { data: null, error: null };
let deleteResult: QueryResult = { data: [{ id: 'label-1' }], error: null };

const supabaseMock = {
	from: (table: string) => {
		if (table === 'projects') {
			return {
				select: () => ({
					eq: () => ({
						limit: () => Promise.resolve(linkedProjectsResult),
					}),
				}),
			};
		}
		if (table === 'project_labels') {
			return {
				select: () => ({
					order: () => Promise.resolve(labelsResult),
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
		return {
			select: () => ({
				eq: () => ({
					order: () => Promise.resolve(domainsResult),
				}),
			}),
		};
	},
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

describe('projectLabelsManagerHelpers', () => {
	let helpers: typeof import('../../../src/lib/projects/projectLabelsManagerHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/projects/projectLabelsManagerHelpers');
	});

	it('shouldBlockProjectLabelSave blocks empty name or domain', () => {
		expect(helpers.shouldBlockProjectLabelSave('', 'domain-1')).toBe(true);
		expect(helpers.shouldBlockProjectLabelSave('Label', '')).toBe(true);
		expect(helpers.shouldBlockProjectLabelSave('Label', 'domain-1')).toBe(false);
	});

	it('resolveProjectLabelSaveOperation returns update when editing', () => {
		expect(helpers.resolveProjectLabelSaveOperation({ id: 'label-1' })).toBe('update');
		expect(helpers.resolveProjectLabelSaveOperation(null)).toBe('create');
	});

	it('resolveProjectLabelDeleteOutcome maps delete results', () => {
		expect(helpers.resolveProjectLabelDeleteOutcome(null, [{ id: 'label-1' }])).toBe('success');
		expect(helpers.resolveProjectLabelDeleteOutcome({ code: PostgresErrorCodes.FOREIGN_KEY_VIOLATION }, null)).toBe(
			'error-linked',
		);
		expect(helpers.resolveProjectLabelDeleteOutcome(null, [])).toBe('error-no-rights');
	});

	it('hasLinkedProjectsForLabel detects linked projects', () => {
		expect(helpers.hasLinkedProjectsForLabel([{ id: 'project-1' }])).toBe(true);
		expect(helpers.hasLinkedProjectsForLabel([])).toBe(false);
	});
});

describe('projectLabelsManagerControllerHelpers', () => {
	let controller: typeof import('../../../src/lib/projects/projectLabelsManagerControllerHelpers');

	beforeAll(async () => {
		controller = await import('../../../src/lib/projects/projectLabelsManagerControllerHelpers');
	});

	beforeEach(() => {
		labelsResult = {
			data: [{ id: 'label-1', name: 'Gitaar', domain_id: 'domain-1', project_domains: { name: 'Muziek' } }],
			error: null,
		};
		domainsResult = { data: [{ id: 'domain-1', name: 'Muziek' }], error: null };
		linkedProjectsResult = { data: [], error: null };
		saveResult = { data: null, error: null };
		deleteResult = { data: [{ id: 'label-1' }], error: null };
	});

	it('executeProjectLabelFetch returns labels and domains on success', async () => {
		expect((await controller.executeProjectLabelFetch(supabaseMock as never)).kind).toBe('success');
	});

	it('runProjectLabelSaveFlow leaves dialog open for invalid input', async () => {
		let dialogOpen = true;
		let refetched = false;
		await controller.runProjectLabelSaveFlow({
			name: '',
			domainId: '',
			editing: null,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			fetchData: async () => {
				refetched = true;
			},
		});
		expect(dialogOpen).toBe(true);
		expect(refetched).toBe(false);
	});

	it('runProjectLabelSaveFlow closes dialog and refetches on success', async () => {
		let dialogOpen = true;
		let refetched = false;
		await controller.runProjectLabelSaveFlow({
			name: 'Piano',
			domainId: 'domain-1',
			editing: null,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			fetchData: async () => {
				refetched = true;
			},
		});
		expect(dialogOpen).toBe(false);
		expect(refetched).toBe(true);
	});

	it('runProjectLabelDeleteFlow clears delete target and refetches after blocked-linked delete', async () => {
		linkedProjectsResult = { data: [{ id: 'project-1' }], error: null };
		let deleteTarget: { id: string; name: string } | null = { id: 'label-1', name: 'Gitaar' };
		let refetched = false;
		await controller.runProjectLabelDeleteFlow({
			deleteTarget: deleteTarget as never,
			supabase: supabaseMock as never,
			setDeleteTarget: (target) => {
				deleteTarget = target;
			},
			fetchData: async () => {
				refetched = true;
			},
		});
		expect(deleteTarget).toBeNull();
		expect(refetched).toBe(true);
	});

	it('runProjectLabelDeleteFlow clears delete target and refetches on success', async () => {
		let deleteTarget: { id: string; name: string } | null = { id: 'label-1', name: 'Gitaar' };
		let refetched = false;
		await controller.runProjectLabelDeleteFlow({
			deleteTarget: deleteTarget as never,
			supabase: supabaseMock as never,
			setDeleteTarget: (target) => {
				deleteTarget = target;
			},
			fetchData: async () => {
				refetched = true;
			},
		});
		expect(deleteTarget).toBeNull();
		expect(refetched).toBe(true);
	});
});
