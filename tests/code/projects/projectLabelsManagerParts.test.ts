import { describe, expect, it } from 'bun:test';
import { resolveListCardView } from '../../../src/lib/ui/listCardViewHelpers';

describe('ProjectLabelsManagerCard view resolution', () => {
	it('returns loading while data is loading', () => {
		expect(resolveListCardView(true, 0)).toBe('loading');
		expect(resolveListCardView(true, 2)).toBe('loading');
	});

	it('returns empty when loaded with no labels', () => {
		expect(resolveListCardView(false, 0)).toBe('empty');
	});

	it('returns list when labels exist', () => {
		expect(resolveListCardView(false, 2)).toBe('list');
	});
});
