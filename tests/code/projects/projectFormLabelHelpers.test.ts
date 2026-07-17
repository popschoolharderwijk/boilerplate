import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type QueryResult = { data: unknown; error: null };

let activeLabelsResult: QueryResult = { data: [], error: null };
let currentLabelResult: QueryResult = { data: null, error: null };
let domainsResult: QueryResult = { data: [], error: null };

const supabaseMock = {
	from: (table: string) => {
		if (table === 'project_labels') {
			return {
				select: () => ({
					eq: (_column: string, value: unknown) => {
						if (value === true) {
							return {
								order: () => Promise.resolve(activeLabelsResult),
							};
						}
						return {
							maybeSingle: () => Promise.resolve(currentLabelResult),
						};
					},
				}),
			};
		}
		return {
			select: () => ({
				in: () => Promise.resolve(domainsResult),
			}),
		};
	},
};

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: supabaseMock,
}));

describe('mergeCurrentProjectLabel', () => {
	it('returns active labels unchanged when no current label is provided', async () => {
		const { mergeCurrentProjectLabel } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		const activeLabels = [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }];
		expect(mergeCurrentProjectLabel(activeLabels, undefined)).toEqual(activeLabels);
	});

	it('prepends the current label when it is missing from active labels', async () => {
		const { mergeCurrentProjectLabel } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		const activeLabels = [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }];
		const currentLabel = { id: 'label-2', name: 'Label B', domain_id: 'domain-2' };
		expect(mergeCurrentProjectLabel(activeLabels, currentLabel)).toEqual([currentLabel, ...activeLabels]);
	});
});

describe('needsCurrentProjectLabelFetch', () => {
	it('returns false when the current label is already active', async () => {
		const { needsCurrentProjectLabelFetch } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		expect(needsCurrentProjectLabelFetch([{ id: 'label-1', name: 'A', domain_id: 'domain-1' }], 'label-1')).toBe(
			false,
		);
	});

	it('returns true when the current label is missing from active labels', async () => {
		const { needsCurrentProjectLabelFetch } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		expect(needsCurrentProjectLabelFetch([{ id: 'label-1', name: 'A', domain_id: 'domain-1' }], 'label-2')).toBe(
			true,
		);
	});
});

describe('assembleProjectLabelOptions', () => {
	it('returns an empty array when no labels are available', async () => {
		const { assembleProjectLabelOptions } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		expect(assembleProjectLabelOptions([], [{ id: 'domain-1', name: 'Pop' }])).toEqual([]);
	});

	it('assembles label options from labels and domain rows', async () => {
		const { assembleProjectLabelOptions } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		expect(
			assembleProjectLabelOptions(
				[{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }],
				[{ id: 'domain-1', name: 'Pop' }],
			),
		).toEqual([{ id: 'label-1', name: 'Label A', domain_name: 'Pop' }]);
	});

	it('uses an em dash when the domain name is missing', async () => {
		const { assembleProjectLabelOptions } = await import('../../../src/lib/projects/projectFormLabelHelpers');
		expect(
			assembleProjectLabelOptions(
				[{ id: 'label-2', name: 'Label B', domain_id: 'domain-3' }],
				[{ id: 'domain-1', name: 'Pop' }],
			),
		).toEqual([{ id: 'label-2', name: 'Label B', domain_name: '—' }]);
	});
});

describe('loadProjectLabelOptions', () => {
	let loadProjectLabelOptions: typeof import('../../../src/lib/projects/projectFormDialogHelpers').loadProjectLabelOptions;

	beforeAll(async () => {
		({ loadProjectLabelOptions } = await import('../../../src/lib/projects/projectFormDialogHelpers'));
	});

	beforeEach(() => {
		activeLabelsResult = { data: [], error: null };
		currentLabelResult = { data: null, error: null };
		domainsResult = { data: [], error: null };
	});

	it('returns an empty array when no labels are available', async () => {
		expect(await loadProjectLabelOptions()).toEqual([]);
	});

	it('loads active labels with domain names', async () => {
		activeLabelsResult = {
			data: [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }],
			error: null,
		};
		domainsResult = { data: [{ id: 'domain-1', name: 'Pop' }], error: null };
		expect(await loadProjectLabelOptions()).toEqual([{ id: 'label-1', name: 'Label A', domain_name: 'Pop' }]);
	});

	it('fetches and merges the current label when it is inactive', async () => {
		activeLabelsResult = {
			data: [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }],
			error: null,
		};
		currentLabelResult = {
			data: { id: 'label-2', name: 'Label B', domain_id: 'domain-2' },
			error: null,
		};
		domainsResult = {
			data: [
				{ id: 'domain-1', name: 'Pop' },
				{ id: 'domain-2', name: 'Rock' },
			],
			error: null,
		};
		expect(await loadProjectLabelOptions('label-2')).toEqual([
			{ id: 'label-2', name: 'Label B', domain_name: 'Rock' },
			{ id: 'label-1', name: 'Label A', domain_name: 'Pop' },
		]);
	});
});
