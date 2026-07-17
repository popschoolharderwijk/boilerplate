import { describe, expect, it } from 'bun:test';
import {
	resolveSidebarDevToolsContainerClass,
	resolveSidebarWidthClass,
	shouldShowSidebarAdminSection,
} from '../../../src/lib/layout/sidebarShellHelpers';

describe('resolveSidebarWidthClass', () => {
	it('returns narrow width when collapsed', () => {
		expect(resolveSidebarWidthClass(true)).toBe('w-16');
	});

	it('returns wide width when expanded', () => {
		expect(resolveSidebarWidthClass(false)).toBe('w-64');
	});
});

describe('resolveSidebarDevToolsContainerClass', () => {
	it('centers dev tools when collapsed', () => {
		expect(resolveSidebarDevToolsContainerClass(true)).toBe('flex justify-center p-2');
	});

	it('uses full width when expanded', () => {
		expect(resolveSidebarDevToolsContainerClass(false)).toBe('p-2 w-full');
	});
});

describe('shouldShowSidebarAdminSection', () => {
	it('returns true when admin nav is visible', () => {
		expect(shouldShowSidebarAdminSection(true)).toBe(true);
	});

	it('returns false when admin nav is hidden', () => {
		expect(shouldShowSidebarAdminSection(false)).toBe(false);
	});
});
