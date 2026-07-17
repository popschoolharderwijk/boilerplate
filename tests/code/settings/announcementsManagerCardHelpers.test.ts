import { describe, expect, it } from 'bun:test';
import { resolveAnnouncementsManagerCardView } from '../../../src/lib/settings/announcementsManagerCardHelpers';

describe('resolveAnnouncementsManagerCardView', () => {
	it('returns schema-missing when schema is unavailable', () => {
		expect(resolveAnnouncementsManagerCardView(true, false, 0)).toBe('schema-missing');
		expect(resolveAnnouncementsManagerCardView(true, true, 5)).toBe('schema-missing');
	});

	it('returns loading when schema is available and data is loading', () => {
		expect(resolveAnnouncementsManagerCardView(false, true, 0)).toBe('loading');
	});

	it('returns empty when loaded with no announcements', () => {
		expect(resolveAnnouncementsManagerCardView(false, false, 0)).toBe('empty');
	});

	it('returns list when announcements exist', () => {
		expect(resolveAnnouncementsManagerCardView(false, false, 3)).toBe('list');
	});
});
