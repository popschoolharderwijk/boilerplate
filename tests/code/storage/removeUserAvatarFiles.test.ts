import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type StorageResult = { data?: { name: string }[] | null; error?: { message: string } | null };

let listResult: StorageResult = { data: [], error: null };
let removeResult: StorageResult = { error: null };
let removedPaths: string[] = [];

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		storage: {
			from: () => ({
				list: () => Promise.resolve(listResult),
				remove: (paths: string[]) => {
					removedPaths = paths;
					return Promise.resolve(removeResult);
				},
			}),
		},
	},
}));

describe('removeUserAvatarFiles', () => {
	let removeUserAvatarFiles: typeof import('../../../src/lib/storage/avatars').removeUserAvatarFiles;

	beforeAll(async () => {
		({ removeUserAvatarFiles } = await import('../../../src/lib/storage/avatars'));
	});

	beforeEach(() => {
		listResult = { data: [], error: null };
		removeResult = { error: null };
		removedPaths = [];
	});

	it('returns no error when no avatar files exist', async () => {
		const result = await removeUserAvatarFiles('user-1');
		expect(result).toEqual({ error: null });
		expect(removedPaths).toEqual([]);
	});

	it('returns no error when listed files do not match the user', async () => {
		listResult = { data: [{ name: 'other-user-avatar.png' }], error: null };
		const result = await removeUserAvatarFiles('user-1');
		expect(result).toEqual({ error: null });
		expect(removedPaths).toEqual([]);
	});

	it('removes matching avatar files for the user', async () => {
		listResult = {
			data: [{ name: 'user-1-avatar.png' }, { name: 'user-1-thumb.png' }, { name: 'other.png' }],
			error: null,
		};
		const result = await removeUserAvatarFiles('user-1');
		expect(result).toEqual({ error: null });
		expect(removedPaths).toEqual(['user-1-avatar.png', 'user-1-thumb.png']);
	});

	it('returns error when storage remove fails', async () => {
		listResult = { data: [{ name: 'user-1-avatar.png' }], error: null };
		removeResult = { error: { message: 'remove failed' } };
		const result = await removeUserAvatarFiles('user-1');
		expect(result.error?.message).toBe('remove failed');
	});
});
