import { describe, expect, it } from 'bun:test';
import {
	resolveDevToolsEnvironmentBadgeClass,
	resolveDevToolsHeaderClass,
	resolveDevToolsTriggerClass,
	shouldRenderDevToolsProductionBadge,
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

describe('shouldRenderDevToolsProductionBadge', () => {
	it('returns true when sidebar is collapsed', () => {
		expect(shouldRenderDevToolsProductionBadge(true)).toBe(true);
	});

	it('returns false when sidebar is expanded', () => {
		expect(shouldRenderDevToolsProductionBadge(false)).toBe(false);
	});
});
