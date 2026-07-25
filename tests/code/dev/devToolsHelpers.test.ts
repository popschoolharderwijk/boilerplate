import { describe, expect, it } from 'bun:test';
import {
	resolveDevToolsEnvironmentBadgeClass,
	resolveDevToolsHeaderClass,
	resolveDevToolsRenderMode,
	resolveDevToolsTriggerClass,
} from '../../../src/lib/dev/devToolsHelpers';

describe('resolveDevToolsHeaderClass', () => {
	it('returns green classes for local dev', () => {
		expect(resolveDevToolsHeaderClass(true)).toContain('green');
	});

	it('returns orange classes for non-local dev', () => {
		expect(resolveDevToolsHeaderClass(false)).toContain('orange');
	});
});

describe('resolveDevToolsEnvironmentBadgeClass', () => {
	it('returns green classes for local dev', () => {
		expect(resolveDevToolsEnvironmentBadgeClass(true)).toContain('green');
	});
});

describe('resolveDevToolsTriggerClass', () => {
	it('returns orange classes for non-local dev', () => {
		expect(resolveDevToolsTriggerClass(false)).toContain('orange');
	});
});

describe('resolveDevToolsRenderMode', () => {
	it('returns production-badge when sidebar is collapsed in production', () => {
		expect(resolveDevToolsRenderMode(true, true)).toBe('production-badge');
	});

	it('returns hidden when sidebar is expanded in production', () => {
		expect(resolveDevToolsRenderMode(true, false)).toBe('hidden');
	});
});
