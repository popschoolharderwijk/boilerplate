import { describe, expect, it } from 'bun:test';
import { resolveListCardView } from '../../../src/lib/ui/listCardViewHelpers';

describe('ProjectDomainsManagerCard view resolution', () => {
	it('shows loading while domains are loading', () => {
		expect(resolveListCardView(true, 0)).toBe('loading');
		expect(resolveListCardView(true, 2)).toBe('loading');
	});

	it('shows empty when loaded with no domains', () => {
		expect(resolveListCardView(false, 0)).toBe('empty');
	});

	it('shows list when domains exist', () => {
		expect(resolveListCardView(false, 2)).toBe('list');
	});
});
