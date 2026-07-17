import { describe, expect, it } from 'bun:test';
import {
	buildQuickNavItems,
	buildTopNavUserInitialsInput,
	formatTopNavDisplayName,
	formatTopNavRoleLabel,
	getNextTheme,
} from '../../../src/lib/layout/topNavHelpers';

describe('buildQuickNavItems', () => {
	it('includes dashboard for all users', () => {
		expect(buildQuickNavItems(false, false)).toEqual([{ href: '/', label: 'Dashboard', group: 'Navigatie' }]);
	});

	it('includes teachers for admins', () => {
		expect(buildQuickNavItems(true, false)).toEqual([
			{ href: '/', label: 'Dashboard', group: 'Navigatie' },
			{ href: '/teachers', label: 'Docenten', group: 'Navigatie' },
		]);
	});
});

describe('formatTopNavDisplayName', () => {
	it('returns full name when both names exist', () => {
		expect(
			formatTopNavDisplayName({ first_name: 'Anna', last_name: 'Bakker', avatar_url: null }, 'anna@example.com'),
		).toBe('Anna Bakker');
	});

	it('falls back to email local part', () => {
		expect(formatTopNavDisplayName(null, 'anna@example.com')).toBe('anna');
	});
});

describe('formatTopNavRoleLabel', () => {
	it('replaces underscore with space', () => {
		expect(formatTopNavRoleLabel('site_admin')).toBe('site admin');
	});

	it('returns null for missing role', () => {
		expect(formatTopNavRoleLabel(null)).toBeNull();
	});
});

describe('getNextTheme', () => {
	it('switches dark to light', () => {
		expect(getNextTheme('dark')).toBe('light');
	});

	it('switches light to dark', () => {
		expect(getNextTheme('light')).toBe('dark');
	});
});

describe('buildTopNavUserInitialsInput', () => {
	it('maps profile and email into initials input', () => {
		expect(
			buildTopNavUserInitialsInput(
				{ first_name: 'Anna', last_name: 'Bakker', avatar_url: null },
				'anna@example.com',
			),
		).toEqual({
			first_name: 'Anna',
			last_name: 'Bakker',
			email: 'anna@example.com',
		});
	});
});
