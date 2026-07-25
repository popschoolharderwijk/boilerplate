import type { IncassoBatch } from '@/lib/incasso/types';

export interface IncassoBatchActionFlags {
	showDraftActions: boolean;
	showGenerateXml: boolean;
	showDownloadXml: boolean;
	showClose: boolean;
}

export function resolveIncassoBatchActionFlags(
	batch: Pick<IncassoBatch, 'status' | 'xml_storage_path'>,
): IncassoBatchActionFlags {
	return {
		showDraftActions: batch.status === 'draft',
		showGenerateXml: batch.status === 'approved',
		showDownloadXml: Boolean(batch.xml_storage_path),
		showClose: batch.status === 'submitted',
	};
}
