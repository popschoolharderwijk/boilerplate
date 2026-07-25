import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
	resolveAnnouncementImageUploadGate,
	runAnnouncementSave,
} from '../../../src/lib/settings/announcementsManagerControllerHelpers';

let saveResult: { error: { message: string } | null } = { error: null };

const supabaseMock = {
	from: () => ({
		insert: () => Promise.resolve(saveResult),
		update: () => ({
			eq: () => Promise.resolve(saveResult),
		}),
	}),
};

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

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

describe('runAnnouncementSave', () => {
	beforeEach(() => {
		saveResult = { error: null };
	});

	it('returns early when form is invalid', async () => {
		let dialogOpen = true;
		let refetched = false;
		await runAnnouncementSave({
			isFormValid: false,
			isSchemaMissing: false,
			form: { title: '', body: '', publish: false },
			audience: ['students'],
			editingId: undefined,
			editingPublishedAt: undefined,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			refetch: async () => {
				refetched = true;
			},
		});
		expect(dialogOpen).toBe(true);
		expect(refetched).toBe(false);
	});

	it('returns early when schema is missing', async () => {
		let dialogOpen = true;
		await runAnnouncementSave({
			isFormValid: true,
			isSchemaMissing: true,
			form: { title: 'Nieuws', body: 'Tekst', publish: false },
			audience: ['students'],
			editingId: undefined,
			editingPublishedAt: undefined,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			refetch: async () => {},
		});
		expect(dialogOpen).toBe(true);
	});

	it('creates announcement and closes dialog on success', async () => {
		let dialogOpen = true;
		let refetched = false;
		await runAnnouncementSave({
			isFormValid: true,
			isSchemaMissing: false,
			form: { title: 'Nieuws', body: 'Tekst', publish: true },
			audience: ['students'],
			editingId: undefined,
			editingPublishedAt: undefined,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			refetch: async () => {
				refetched = true;
			},
		});
		expect(dialogOpen).toBe(false);
		expect(refetched).toBe(true);
	});

	it('updates announcement when editing id is present', async () => {
		let dialogOpen = true;
		await runAnnouncementSave({
			isFormValid: true,
			isSchemaMissing: false,
			form: { title: 'Nieuws', body: 'Tekst', publish: true },
			audience: ['students'],
			editingId: 'ann-1',
			editingPublishedAt: '2026-01-01T00:00:00Z',
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			refetch: async () => {},
		});
		expect(dialogOpen).toBe(false);
	});

	it('keeps dialog open when save fails', async () => {
		saveResult = { error: { message: 'denied' } };
		let dialogOpen = true;
		await runAnnouncementSave({
			isFormValid: true,
			isSchemaMissing: false,
			form: { title: 'Nieuws', body: 'Tekst', publish: true },
			audience: ['students'],
			editingId: undefined,
			editingPublishedAt: undefined,
			supabase: supabaseMock as never,
			setSaving: () => {},
			setDialogOpen: (open) => {
				dialogOpen = open;
			},
			refetch: async () => {},
		});
		expect(dialogOpen).toBe(true);
	});
});
