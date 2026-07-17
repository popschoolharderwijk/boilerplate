import { describe, expect, it } from 'bun:test';
import { buildIncassoBatchActionDescriptors } from '../../../src/lib/incasso/incassoBatchActionDescriptors';
import type { IncassoBatch } from '../../../src/lib/incasso/types';

const batch = { item_count: 2, xml_storage_path: 'sepa/batch-1.xml' } as IncassoBatch;

describe('buildIncassoBatchActionDescriptors', () => {
	it('includes disabled approve descriptor for empty batch', () => {
		expect(
			buildIncassoBatchActionDescriptors(
				{
					showDraftActions: true,
					showGenerateXml: false,
					showDownloadXml: false,
					showClose: false,
				},
				{ item_count: 0 } as IncassoBatch,
				false,
			),
		).toEqual([
			{ kind: 'build', label: 'Vul concept', variant: 'default', disabled: false },
			{ kind: 'approve', label: 'Goedkeuren', variant: 'outline', disabled: true },
		]);
	});

	it('returns draft action descriptors for draft batches', () => {
		expect(
			buildIncassoBatchActionDescriptors(
				{
					showDraftActions: true,
					showGenerateXml: false,
					showDownloadXml: false,
					showClose: false,
				},
				batch,
				false,
			),
		).toEqual([
			{ kind: 'build', label: 'Vul concept', variant: 'default', disabled: false },
			{ kind: 'approve', label: 'Goedkeuren', variant: 'outline', disabled: false },
		]);
	});

	it('returns xml and close descriptors when enabled', () => {
		expect(
			buildIncassoBatchActionDescriptors(
				{
					showDraftActions: false,
					showGenerateXml: true,
					showDownloadXml: true,
					showClose: true,
				},
				batch,
				true,
			),
		).toEqual([
			{ kind: 'generate-xml', label: 'Genereer XML & aanbieden', variant: 'default', disabled: true },
			{ kind: 'download-xml', label: 'Download XML', variant: 'outline', disabled: false },
			{ kind: 'close', label: 'Markeer als afgerond', variant: 'outline', disabled: false },
		]);
	});
});
