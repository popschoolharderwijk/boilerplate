import { describe, expect, it } from 'bun:test';
import { resolveDevToolsRenderMode } from '../../../src/lib/dev/devToolsHelpers';

describe('resolveDevToolsRenderMode', () => {
	it('returns hidden in production when sidebar is expanded', () => {
		expect(resolveDevToolsRenderMode(true, false)).toBe('hidden');
	});

	it('returns production-badge in production when sidebar is collapsed', () => {
		expect(resolveDevToolsRenderMode(true, true)).toBe('production-badge');
	});

	it('returns collapsed in non-production when sidebar is collapsed', () => {
		expect(resolveDevToolsRenderMode(false, true)).toBe('collapsed');
	});

	it('returns expanded in non-production when sidebar is expanded', () => {
		expect(resolveDevToolsRenderMode(false, false)).toBe('expanded');
	});
});
