import { describe, expect, it } from 'bun:test';
import {
	resolveAnnouncementImageUploadGate,
	resolveAnnouncementSaveErrorMessage,
	resolveAnnouncementSaveOperation,
	resolveAnnouncementSaveSuccessMessage,
	shouldBlockAnnouncementSave,
} from '../../../src/lib/settings/announcementsManagerControllerHelpers';

describe('resolveAnnouncementImageUploadGate', () => {
	it('returns no-file when file is missing', () => {
		expect(resolveAnnouncementImageUploadGate(undefined, false)).toBe('no-file');
	});

	it('returns schema-missing when schema is unavailable', () => {
		expect(resolveAnnouncementImageUploadGate({ type: 'image/png' } as File, true)).toBe('schema-missing');
	});

	it('returns invalid-file for non-image uploads', () => {
		expect(resolveAnnouncementImageUploadGate({ type: 'text/plain' } as File, false)).toBe('invalid-file');
	});

	it('returns proceed for valid image uploads', () => {
		expect(resolveAnnouncementImageUploadGate({ type: 'image/png' } as File, false)).toBe('proceed');
	});
});

describe('resolveAnnouncementSaveOperation', () => {
	it('returns update when editing id is present', () => {
		expect(resolveAnnouncementSaveOperation('ann-1')).toBe('update');
	});

	it('returns insert when editing id is absent', () => {
		expect(resolveAnnouncementSaveOperation(undefined)).toBe('insert');
	});
});

describe('shouldBlockAnnouncementSave', () => {
	it('blocks invalid or unavailable saves', () => {
		expect(shouldBlockAnnouncementSave(false, false)).toBe(true);
		expect(shouldBlockAnnouncementSave(true, true)).toBe(true);
	});

	it('allows valid saves when schema is available', () => {
		expect(shouldBlockAnnouncementSave(true, false)).toBe(false);
	});
});

describe('resolveAnnouncementSaveErrorMessage', () => {
	it('returns update and create error titles', () => {
		expect(resolveAnnouncementSaveErrorMessage('update')).toBe('Opslaan mislukt');
		expect(resolveAnnouncementSaveErrorMessage('insert')).toBe('Aanmaken mislukt');
	});
});

describe('resolveAnnouncementSaveSuccessMessage', () => {
	it('returns update and create success titles', () => {
		expect(resolveAnnouncementSaveSuccessMessage('update')).toBe('Bericht bijgewerkt');
		expect(resolveAnnouncementSaveSuccessMessage('insert')).toBe('Bericht aangemaakt');
	});
});
