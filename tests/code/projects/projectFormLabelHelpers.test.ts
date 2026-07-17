import { describe, expect, it } from 'bun:test';
import {
	assembleProjectLabelOptions,
	collectProjectDomainIds,
	mapProjectLabelOptions,
	mergeCurrentProjectLabel,
	needsCurrentProjectLabelFetch,
} from '../../../src/lib/projects/projectFormLabelHelpers';

describe('mergeCurrentProjectLabel', () => {
	it('returns active labels unchanged when no current label is provided', () => {
		const activeLabels = [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }];
		expect(mergeCurrentProjectLabel(activeLabels, undefined)).toEqual(activeLabels);
	});

	it('prepends the current label when it is missing from active labels', () => {
		const activeLabels = [{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }];
		const currentLabel = { id: 'label-2', name: 'Label B', domain_id: 'domain-2' };
		expect(mergeCurrentProjectLabel(activeLabels, currentLabel)).toEqual([currentLabel, ...activeLabels]);
	});
});

describe('collectProjectDomainIds', () => {
	it('returns unique domain ids from label rows', () => {
		expect(
			collectProjectDomainIds([
				{ id: 'label-1', name: 'A', domain_id: 'domain-1' },
				{ id: 'label-2', name: 'B', domain_id: 'domain-1' },
				{ id: 'label-3', name: 'C', domain_id: 'domain-2' },
			]),
		).toEqual(['domain-1', 'domain-2']);
	});
});

describe('mapProjectLabelOptions', () => {
	it('maps labels to options with domain names', () => {
		const domainMap = new Map([
			['domain-1', 'Pop'],
			['domain-2', 'Rock'],
		]);
		expect(
			mapProjectLabelOptions(
				[
					{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' },
					{ id: 'label-2', name: 'Label B', domain_id: 'domain-3' },
				],
				domainMap,
			),
		).toEqual([
			{ id: 'label-1', name: 'Label A', domain_name: 'Pop' },
			{ id: 'label-2', name: 'Label B', domain_name: '—' },
		]);
	});
});

describe('needsCurrentProjectLabelFetch', () => {
	it('returns false when the current label is already active', () => {
		expect(needsCurrentProjectLabelFetch([{ id: 'label-1', name: 'A', domain_id: 'domain-1' }], 'label-1')).toBe(
			false,
		);
	});

	it('returns true when the current label is missing from active labels', () => {
		expect(needsCurrentProjectLabelFetch([{ id: 'label-1', name: 'A', domain_id: 'domain-1' }], 'label-2')).toBe(
			true,
		);
	});
});

describe('assembleProjectLabelOptions', () => {
	it('returns an empty array when no labels are available', () => {
		expect(assembleProjectLabelOptions([], [{ id: 'domain-1', name: 'Pop' }])).toEqual([]);
	});

	it('assembles label options from labels and domain rows', () => {
		expect(
			assembleProjectLabelOptions(
				[{ id: 'label-1', name: 'Label A', domain_id: 'domain-1' }],
				[{ id: 'domain-1', name: 'Pop' }],
			),
		).toEqual([{ id: 'label-1', name: 'Label A', domain_name: 'Pop' }]);
	});
});
