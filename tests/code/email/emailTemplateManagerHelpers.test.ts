import { describe, expect, it } from 'bun:test';
import {
	buildEmailTemplateRowsMap,
	getEmailTemplateStatusClassName,
	getEmailTemplateStatusLabel,
	mergeSavedEmailTemplateRow,
	renderEmailTemplatePreview,
	resolveEmailTemplateTestResult,
	toggleEmailTemplateActiveKey,
} from '../../../src/lib/email/emailTemplateManagerHelpers';

describe('renderEmailTemplatePreview', () => {
	it('replaces known template variables', () => {
		expect(renderEmailTemplatePreview('Hallo {{name}}', { name: 'Jan' })).toBe('Hallo Jan');
	});

	it('leaves unknown variables unchanged', () => {
		expect(renderEmailTemplatePreview('Hallo {{name}}', {})).toBe('Hallo {{name}}');
	});
});

describe('buildEmailTemplateRowsMap', () => {
	it('indexes rows by event key', () => {
		expect(
			buildEmailTemplateRowsMap([
				{ event_key: 'signup', subject: 'Welkom', body_html: '<p>Hi</p>', is_enabled: true },
			]),
		).toEqual({
			signup: { event_key: 'signup', subject: 'Welkom', body_html: '<p>Hi</p>', is_enabled: true },
		});
	});
});

describe('toggleEmailTemplateActiveKey', () => {
	it('opens the selected event key', () => {
		expect(toggleEmailTemplateActiveKey(null, 'signup')).toBe('signup');
	});

	it('closes the active event key when clicked again', () => {
		expect(toggleEmailTemplateActiveKey('signup', 'signup')).toBeNull();
	});
});

describe('resolveEmailTemplateTestResult', () => {
	it('returns skipped when the function response was skipped', () => {
		expect(resolveEmailTemplateTestResult({ skipped: true })).toBe('skipped');
	});

	it('returns sent when the function response was not skipped', () => {
		expect(resolveEmailTemplateTestResult({ skipped: false })).toBe('sent');
	});
});

describe('mergeSavedEmailTemplateRow', () => {
	it('merges editor state into the existing row', () => {
		expect(
			mergeSavedEmailTemplateRow(
				{ event_key: 'signup', subject: 'Old', body_html: '<p>Old</p>', is_enabled: false },
				{ subject: 'New', body_html: '<p>New</p>', is_enabled: true },
			),
		).toEqual({
			event_key: 'signup',
			subject: 'New',
			body_html: '<p>New</p>',
			is_enabled: true,
		});
	});
});

describe('getEmailTemplateStatusLabel', () => {
	it('returns the active label for enabled templates', () => {
		expect(getEmailTemplateStatusLabel(true)).toBe('Actief');
	});
});

describe('getEmailTemplateStatusClassName', () => {
	it('returns the muted class for disabled templates', () => {
		expect(getEmailTemplateStatusClassName(false)).toBe('bg-muted text-muted-foreground');
	});
});
