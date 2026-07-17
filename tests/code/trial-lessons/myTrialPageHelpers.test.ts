import { describe, expect, it } from 'bun:test';
import { resolveMyTrialContentState, resolveMyTrialPageGate } from '../../../src/lib/trial-lessons/myTrialPageHelpers';

describe('resolveMyTrialPageGate', () => {
	it('returns auth-loading while auth is loading', () => {
		expect(resolveMyTrialPageGate(true, true)).toBe('auth-loading');
	});

	it('returns unauthenticated without user', () => {
		expect(resolveMyTrialPageGate(false, false)).toBe('unauthenticated');
	});

	it('returns ready for authenticated user', () => {
		expect(resolveMyTrialPageGate(false, true)).toBe('ready');
	});
});

describe('resolveMyTrialContentState', () => {
	it('returns loading while trial data loads', () => {
		expect(resolveMyTrialContentState(true, false)).toBe('loading');
	});

	it('returns empty when no trial exists', () => {
		expect(resolveMyTrialContentState(false, false)).toBe('empty');
	});

	it('returns content when trial exists', () => {
		expect(resolveMyTrialContentState(false, true)).toBe('content');
	});
});
