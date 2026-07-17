import { describe, expect, it } from 'bun:test';
import {
	applyLegacyImportActionToast,
	reportLegacyImportActionError,
	runLegacyImportAction,
} from '../../../src/lib/settings/legacyImportManagerActionHelpers';

describe('applyLegacyImportActionToast', () => {
	it('returns without throwing when toast is undefined', () => {
		expect(applyLegacyImportActionToast(undefined)).toBeUndefined();
	});
});

describe('reportLegacyImportActionError', () => {
	it('returns without throwing for error results', () => {
		expect(
			reportLegacyImportActionError({
				ok: false,
				title: 'Import mislukt',
				message: 'network',
			}),
		).toBeUndefined();
	});
});

describe('runLegacyImportAction', () => {
	it('calls onSuccess for successful actions', async () => {
		const successes: string[] = [];
		await runLegacyImportAction(
			async () => ({ ok: true, data: 'done', toast: { kind: 'success', message: 'ok' } }),
			(data) => successes.push(data),
		);
		expect(successes).toEqual(['done']);
	});

	it('skips onSuccess for failed actions', async () => {
		const successes: string[] = [];
		await runLegacyImportAction(
			async () => ({ ok: false, title: 'Validatie mislukt', message: 'network' }),
			(data) => successes.push(String(data)),
		);
		expect(successes).toEqual([]);
	});
});
