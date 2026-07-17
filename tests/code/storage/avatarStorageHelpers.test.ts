import { describe, expect, it } from 'bun:test';
import { filterAvatarFileNamesForUser } from '../../../src/lib/storage/avatarStorageHelpers';

describe('filterAvatarFileNamesForUser', () => {
	it('returns matching avatar file names for the user', () => {
		expect(
			filterAvatarFileNamesForUser(
				[{ name: 'user-1-avatar.png' }, { name: 'user-2-avatar.png' }, { name: 'other.png' }],
				'user-1',
			),
		).toEqual(['user-1-avatar.png']);
	});

	it('returns empty array when no files match', () => {
		expect(filterAvatarFileNamesForUser([{ name: 'other.png' }], 'user-1')).toEqual([]);
	});
});
