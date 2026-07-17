import { describe, expect, it } from 'bun:test';
import {
	buildAnnouncementImageMarkdown,
	prepareAnnouncementImageUpload,
	resolveAnnouncementImageUploadToast,
} from '../../../src/lib/settings/announcementsImageUploadHelpers';

describe('resolveAnnouncementImageUploadToast', () => {
	it('returns schema-missing message', () => {
		expect(resolveAnnouncementImageUploadToast('schema-missing')).toBe('Nieuwsberichten zijn nog niet beschikbaar');
	});

	it('returns invalid-file message', () => {
		expect(resolveAnnouncementImageUploadToast('invalid-file')).toBe('Alleen afbeeldingen zijn toegestaan');
	});

	it('returns null for proceed and no-file gates', () => {
		expect(resolveAnnouncementImageUploadToast('proceed')).toBeNull();
		expect(resolveAnnouncementImageUploadToast('no-file')).toBeNull();
	});
});

describe('buildAnnouncementImageMarkdown', () => {
	it('builds markdown image syntax', () => {
		expect(buildAnnouncementImageMarkdown('photo.png', 'https://example.com/photo.png')).toBe(
			'![photo.png](https://example.com/photo.png)',
		);
	});
});

describe('prepareAnnouncementImageUpload', () => {
	it('blocks upload when schema is missing', () => {
		const file = new File(['content'], 'photo.png', { type: 'image/png' });
		expect(prepareAnnouncementImageUpload(file, true)).toEqual({
			status: 'blocked',
			gate: 'schema-missing',
		});
	});

	it('blocks upload when no file is selected', () => {
		expect(prepareAnnouncementImageUpload(undefined, false)).toEqual({
			status: 'blocked',
			gate: 'no-file',
		});
	});

	it('returns ready when file is valid', () => {
		const file = new File(['content'], 'photo.png', { type: 'image/png' });
		expect(prepareAnnouncementImageUpload(file, false)).toEqual({
			status: 'ready',
			file,
		});
	});
});
