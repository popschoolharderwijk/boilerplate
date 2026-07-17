import { describe, expect, it } from 'bun:test';
import { buildAnnouncementsFetchState } from '../../../src/lib/settings/announcementsQueryHelpers';

describe('buildAnnouncementsFetchState', () => {
	it('returns empty announcements with schema missing flag on query error', () => {
		expect(buildAnnouncementsFetchState({ code: '42P01', message: 'announcements missing' }, null)).toEqual({
			isSchemaMissing: true,
			error: 'announcements missing',
			announcements: [],
		});
	});

	it('detects PGRST205 as schema missing', () => {
		expect(buildAnnouncementsFetchState({ code: 'PGRST205', message: 'missing' }, null).isSchemaMissing).toBe(true);
	});

	it('detects announcements table mentions in message', () => {
		expect(
			buildAnnouncementsFetchState({ message: 'relation announcements does not exist' }, null).isSchemaMissing,
		).toBe(true);
	});

	it('returns false schema missing for unrelated errors', () => {
		expect(buildAnnouncementsFetchState({ message: 'permission denied' }, null).isSchemaMissing).toBe(false);
	});

	it('returns announcements on successful query', () => {
		expect(buildAnnouncementsFetchState(null, [{ id: 'ann-1', title: 'News' }])).toEqual({
			isSchemaMissing: false,
			error: null,
			announcements: [{ id: 'ann-1', title: 'News' }],
		});
	});
});
