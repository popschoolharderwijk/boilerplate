import { describe, expect, it } from 'bun:test';
import {
	resolveIncassoBatchActionHandler,
	resolveIncassoBatchActionIcon,
	resolveIncassoBatchActionKinds,
	shouldDisableIncassoApproveAction,
} from '../../../src/lib/incasso/incassoBatchActionBarHelpers';

describe('resolveIncassoBatchActionKinds', () => {
	it('returns draft actions for draft batches', () => {
		expect(
			resolveIncassoBatchActionKinds({
				showDraftActions: true,
				showGenerateXml: false,
				showDownloadXml: false,
				showClose: false,
			}),
		).toEqual(['build', 'approve']);
	});

	it('returns xml and close actions when enabled', () => {
		expect(
			resolveIncassoBatchActionKinds({
				showDraftActions: false,
				showGenerateXml: true,
				showDownloadXml: true,
				showClose: true,
			}),
		).toEqual(['generate-xml', 'download-xml', 'close']);
	});
});

describe('shouldDisableIncassoApproveAction', () => {
	it('disables approve when busy or batch has no items', () => {
		expect(shouldDisableIncassoApproveAction(0, false)).toBe(true);
		expect(shouldDisableIncassoApproveAction(2, true)).toBe(true);
	});

	it('enables approve when batch has items and is not busy', () => {
		expect(shouldDisableIncassoApproveAction(2, false)).toBe(false);
	});
});

describe('resolveIncassoBatchActionIcon', () => {
	it('returns icon for build action', () => {
		expect(resolveIncassoBatchActionIcon('build')).toBeDefined();
	});

	it('returns icon for generate-xml action', () => {
		expect(resolveIncassoBatchActionIcon('generate-xml')).toBeDefined();
	});

	it('returns icon for download-xml action', () => {
		expect(resolveIncassoBatchActionIcon('download-xml')).toBeDefined();
	});

	it('returns null for approve action', () => {
		expect(resolveIncassoBatchActionIcon('approve')).toBeNull();
	});
});

describe('resolveIncassoBatchActionHandler', () => {
	it('returns build handler', () => {
		let buildCalled = false;
		const handlers = {
			onBuild: () => {
				buildCalled = true;
			},
			onApprove: () => {},
			onGenerateXml: () => {},
			onClose: () => {},
			onDownloadXml: () => {},
			batch: { xml_storage_path: 'sepa/batch.xml' },
		};
		resolveIncassoBatchActionHandler('build', handlers)();
		expect(buildCalled).toBe(true);
	});

	it('returns download handler with xml path', () => {
		let downloadedPath = '';
		const handlers = {
			onBuild: () => {},
			onApprove: () => {},
			onGenerateXml: () => {},
			onClose: () => {},
			onDownloadXml: (path: string) => {
				downloadedPath = path;
			},
			batch: { xml_storage_path: 'sepa/batch.xml' },
		};
		resolveIncassoBatchActionHandler('download-xml', handlers)();
		expect(downloadedPath).toBe('sepa/batch.xml');
	});

	it('returns close handler', () => {
		let closeCalled = false;
		const handlers = {
			onBuild: () => {},
			onApprove: () => {},
			onGenerateXml: () => {},
			onClose: () => {
				closeCalled = true;
			},
			onDownloadXml: () => {},
			batch: { xml_storage_path: 'sepa/batch.xml' },
		};
		resolveIncassoBatchActionHandler('close', handlers)();
		expect(closeCalled).toBe(true);
	});
});
