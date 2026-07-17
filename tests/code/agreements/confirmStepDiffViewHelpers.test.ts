import { describe, expect, it } from 'bun:test';
import { resolveConfirmStepPeriodBounds } from '../../../src/lib/agreements/confirmStepDiffViewHelpers';

describe('resolveConfirmStepPeriodBounds', () => {
	it('prefers loaded period dates over initial agreement dates', () => {
		const bounds = resolveConfirmStepPeriodBounds(
			{
				start_date: '2026-01-01',
				end_date: '2026-06-01',
			} as Parameters<typeof resolveConfirmStepPeriodBounds>[0],
			{ start_date: '2026-02-01', end_date: '2026-07-01' },
		);
		expect(bounds.periodStart).toBe('2026-02-01');
		expect(bounds.periodEnd).toBe('2026-07-01');
	});

	it('falls back to initial agreement dates when loaded period is null', () => {
		const bounds = resolveConfirmStepPeriodBounds(
			{
				start_date: '2026-01-01',
				end_date: '2026-06-01',
			} as Parameters<typeof resolveConfirmStepPeriodBounds>[0],
			null,
		);
		expect(bounds.periodStart).toBe('2026-01-01');
		expect(bounds.periodEnd).toBe('2026-06-01');
	});
});
