import { describe, expect, it } from 'bun:test';
import { getAnnouncementPublishedAt } from '../../../src/lib/dashboard/announcementsSectionPartsHelpers';

describe('getAnnouncementPublishedAt', () => {
	it('returns published_at from announcement', () => {
		expect(
			getAnnouncementPublishedAt({
				id: 'a-1',
				title: 'Nieuws',
				body: 'Body',
				audience: ['teachers'],
				is_active: true,
				published_at: '2026-01-15T10:00:00Z',
				created_at: '2026-01-15T09:00:00Z',
				updated_at: '2026-01-15T09:00:00Z',
			}),
		).toBe('2026-01-15T10:00:00Z');
	});
});
