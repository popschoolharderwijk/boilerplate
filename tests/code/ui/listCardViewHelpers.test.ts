import { describe, expect, it } from 'bun:test';
import { resolveListCardView } from '../../../src/lib/ui/listCardViewHelpers';

describe('resolveListCardView', () => {
	it('returns loading while data is loading', () => {
		expect(resolveListCardView(true, 0)).toBe('loading');
		expect(resolveListCardView(true, 3)).toBe('loading');
	});

	it('returns empty when loaded with no items', () => {
		expect(resolveListCardView(false, 0)).toBe('empty');
	});

	it('returns list when loaded with items', () => {
		expect(resolveListCardView(false, 2)).toBe('list');
	});
});
