import { describe, expect, it, mock } from 'bun:test';
import { runAnnouncementImageUpload } from '../../../src/lib/settings/announcementsImageUploadHelpers';

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

describe('runAnnouncementImageUpload', () => {
	it('returns blocked when schema is missing', async () => {
		const file = new File(['content'], 'photo.png', { type: 'image/png' });
		const outcome = await runAnnouncementImageUpload({
			file,
			isSchemaMissing: true,
			supabase: {} as never,
			insertAtCursor: () => {},
		});
		expect(outcome).toBe('blocked');
	});

	it('returns blocked when no file is selected', async () => {
		const outcome = await runAnnouncementImageUpload({
			file: undefined,
			isSchemaMissing: false,
			supabase: {} as never,
			insertAtCursor: () => {},
		});
		expect(outcome).toBe('blocked');
	});

	it('returns blocked for non-image files', async () => {
		const file = new File(['content'], 'notes.txt', { type: 'text/plain' });
		const outcome = await runAnnouncementImageUpload({
			file,
			isSchemaMissing: false,
			supabase: {} as never,
			insertAtCursor: () => {},
		});
		expect(outcome).toBe('blocked');
	});

	it('uploads image and inserts markdown at cursor on success', async () => {
		const file = new File(['content'], 'photo.png', { type: 'image/png' });
		const inserted: string[] = [];
		const outcome = await runAnnouncementImageUpload({
			file,
			isSchemaMissing: false,
			supabase: {
				storage: {
					from: () => ({
						upload: async () => ({ error: null }),
						getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/photo.png' } }),
					}),
				},
			} as never,
			insertAtCursor: (markdown) => {
				inserted.push(markdown);
			},
		});
		expect(outcome).toBe('uploaded');
		expect(inserted).toEqual(['![photo.png](https://example.com/photo.png)']);
	});
});
