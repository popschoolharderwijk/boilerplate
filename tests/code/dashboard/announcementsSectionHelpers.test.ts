import { describe, expect, it } from 'bun:test';
import {
	getDefaultExpandedAnnouncementIds,
	toggleExpandedAnnouncementId,
} from '../../../src/lib/dashboard/announcementsSectionHelpers';

describe('getDefaultExpandedAnnouncementIds', () => {
	it('returns an empty set for no announcements', () => {
		expect(getDefaultExpandedAnnouncementIds([])).toEqual(new Set());
	});

	it('expands the first announcement by default', () => {
		expect(getDefaultExpandedAnnouncementIds(['a-1', 'a-2'])).toEqual(new Set(['a-1']));
	});
});

describe('toggleExpandedAnnouncementId', () => {
	it('adds an id when it is not expanded yet', () => {
		expect(toggleExpandedAnnouncementId(new Set(['a-1']), 'a-2')).toEqual(new Set(['a-1', 'a-2']));
	});

	it('removes an id when it is already expanded', () => {
		expect(toggleExpandedAnnouncementId(new Set(['a-1', 'a-2']), 'a-2')).toEqual(new Set(['a-1']));
	});
});
