import { describe, expect, it } from 'bun:test';
import { shouldRenderMyTrialCard } from '../../../src/lib/trial-lessons/myTrialBodyHelpers';

const trial = {
	id: 'trial-1',
	status: 'scheduled',
} as Parameters<typeof shouldRenderMyTrialCard>[1] & object;

describe('shouldRenderMyTrialCard', () => {
	it('returns false while loading', () => {
		expect(shouldRenderMyTrialCard('loading', trial)).toBe(false);
	});

	it('returns false when empty', () => {
		expect(shouldRenderMyTrialCard('empty', trial)).toBe(false);
	});

	it('returns false for content state without latest trial', () => {
		expect(shouldRenderMyTrialCard('content', undefined)).toBe(false);
	});

	it('returns true for content state with latest trial', () => {
		expect(shouldRenderMyTrialCard('content', trial)).toBe(true);
	});
});
