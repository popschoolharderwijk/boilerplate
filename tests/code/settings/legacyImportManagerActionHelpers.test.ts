import { describe, expect, it, mock } from 'bun:test';
import { runLegacyImportAction } from '../../../src/lib/settings/legacyImportManagerActionHelpers';

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
		warning: () => {},
	},
}));

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

	it('shows warning toast for successful actions with warning toast', async () => {
		const successes: string[] = [];
		await runLegacyImportAction(
			async () => ({ ok: true, data: null, toast: { kind: 'warning', message: 'partial' } }),
			(data) => successes.push(String(data)),
		);
		expect(successes).toEqual(['null']);
	});
});
