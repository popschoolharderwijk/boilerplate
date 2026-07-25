import { describe, expect, it, mock } from 'bun:test';

mock.module('sonner', () => ({
	toast: {
		error: mock(() => undefined),
		success: mock(() => undefined),
	},
}));

import { toast } from 'sonner';
import { notifyAgendaOpResult } from '../../../src/lib/agenda/notifyAgendaOpResult';

describe('notifyAgendaOpResult', () => {
	it('shows error toast and returns false when not ok', async () => {
		const ok = await notifyAgendaOpResult({ ok: false, message: 'Mislukt' });
		expect(ok).toBe(false);
		expect(toast.error).toHaveBeenCalled();
	});

	it('throws when throwOnError is set', async () => {
		await expect(
			notifyAgendaOpResult({ ok: false, message: 'Boom' }, undefined, { throwOnError: true }),
		).rejects.toThrow('Boom');
	});

	it('shows success toast and runs onSuccess', async () => {
		let called = false;
		const ok = await notifyAgendaOpResult({ ok: true, message: 'Gelukt' }, () => {
			called = true;
		});
		expect(ok).toBe(true);
		expect(called).toBe(true);
		expect(toast.success).toHaveBeenCalled();
	});
});
