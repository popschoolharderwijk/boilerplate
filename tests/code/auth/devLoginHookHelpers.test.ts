import { describe, expect, it } from 'bun:test';
import {
	resolveDevLoginAttemptError,
	resolveDevLoginButtonClass,
	resolveDevLoginButtonLabel,
	resolveDevLoginContainerBorderClass,
} from '../../../src/lib/auth/devLoginHookHelpers';

describe('resolveDevLoginAttemptError', () => {
	it('returns selection error when email is missing', () => {
		expect(resolveDevLoginAttemptError(null)).toBe('Selecteer eerst een rol, docent, leerling of user');
	});

	it('returns null for valid email when password env is set', () => {
		const previous = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
		import.meta.env.VITE_DEV_LOGIN_PASSWORD = 'secret';
		expect(resolveDevLoginAttemptError('teacher-alice@test.nl')).toBeNull();
		import.meta.env.VITE_DEV_LOGIN_PASSWORD = previous;
	});
});

describe('resolveDevLoginButtonLabel', () => {
	it('returns loading label while busy', () => {
		expect(resolveDevLoginButtonLabel(true)).toBe('Inloggen...');
	});

	it('returns idle label when not busy', () => {
		expect(resolveDevLoginButtonLabel(false)).toBe('Dev Login');
	});
});

describe('resolveDevLoginContainerBorderClass', () => {
	it('returns green border class for local dev', () => {
		expect(resolveDevLoginContainerBorderClass(true)).toContain('green');
	});

	it('returns orange border class for non-local dev', () => {
		expect(resolveDevLoginContainerBorderClass(false)).toContain('orange');
	});
});

describe('resolveDevLoginButtonClass', () => {
	it('returns green button class for local dev', () => {
		expect(resolveDevLoginButtonClass(true)).toContain('green');
	});

	it('returns orange button class for non-local dev', () => {
		expect(resolveDevLoginButtonClass(false)).toContain('orange');
	});
});
