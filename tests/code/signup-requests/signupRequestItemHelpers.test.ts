import { describe, expect, it } from 'bun:test';
import { resolveSignupRequestBadgeVariant } from '../../../src/lib/signup-requests/signupRequestItemHelpers';

describe('resolveSignupRequestBadgeVariant', () => {
	it('returns default for pending status', () => {
		expect(resolveSignupRequestBadgeVariant('pending')).toBe('default');
	});

	it('returns secondary for approved status', () => {
		expect(resolveSignupRequestBadgeVariant('approved')).toBe('secondary');
	});

	it('returns outline for rejected status', () => {
		expect(resolveSignupRequestBadgeVariant('rejected')).toBe('outline');
	});

	it('returns outline for trial_scheduled status', () => {
		expect(resolveSignupRequestBadgeVariant('trial_scheduled')).toBe('outline');
	});
});
