import { describe, expect, it } from 'bun:test';
import { resolveDevLoginInnerContainerClass } from '../../../src/lib/auth/devLoginButtonHelpers';

describe('resolveDevLoginInnerContainerClass', () => {
	it('returns plain wrapper when button is hidden', () => {
		expect(resolveDevLoginInnerContainerClass(false, true)).toBe('flex flex-col w-full');
	});

	it('returns green bordered container for local dev with button', () => {
		expect(resolveDevLoginInnerContainerClass(true, true)).toContain('green');
	});

	it('returns orange bordered container for non-local dev with button', () => {
		expect(resolveDevLoginInnerContainerClass(true, false)).toContain('orange');
	});
});
