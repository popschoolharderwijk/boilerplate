import { describe, expect, it } from 'bun:test';
import {
	resolveDevLoginButtonClass,
	resolveDevLoginButtonLabel,
	resolveDevLoginCredentials,
} from '../../../src/lib/auth/devLoginHookHelpers';

describe('resolveDevLoginCredentials', () => {
	it('returns selection error when email is missing', () => {
		expect(resolveDevLoginCredentials(null)).toEqual({
			ok: false,
			error: 'Selecteer eerst een rol, docent, leerling of user',
		});
	});

	it('returns credentials for valid email when password env is set', () => {
		const previous = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
		import.meta.env.VITE_DEV_LOGIN_PASSWORD = 'secret';
		expect(resolveDevLoginCredentials('teacher-alice@test.nl')).toEqual({
			ok: true,
			email: 'teacher-alice@test.nl',
			password: 'secret',
		});
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

describe('resolveDevLoginButtonClass', () => {
	it('returns green button class for local dev', () => {
		expect(resolveDevLoginButtonClass(true)).toContain('green');
	});

	it('returns orange button class for non-local dev', () => {
		expect(resolveDevLoginButtonClass(false)).toContain('orange');
	});
});
