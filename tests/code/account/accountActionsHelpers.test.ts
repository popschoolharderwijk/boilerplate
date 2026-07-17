import { beforeAll, describe, expect, it, mock } from 'bun:test';

const toastCalls: { kind: 'error' | 'success'; message: string; description?: string }[] = [];

mock.module('sonner', () => ({
	toast: {
		error: (message: string, options?: { description?: string }) => {
			toastCalls.push({ kind: 'error', message, description: options?.description });
		},
		success: (message: string) => {
			toastCalls.push({ kind: 'success', message });
		},
	},
}));

describe('accountActionsHelpers', () => {
	let helpers: typeof import('../../../src/lib/account/accountActionsHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/account/accountActionsHelpers');
	});

	describe('hasProfileValidationErrors', () => {
		it('returns true when errors exist', () => {
			expect(helpers.hasProfileValidationErrors({ phone_number: 'invalid' })).toBe(true);
		});

		it('returns false for empty errors', () => {
			expect(helpers.hasProfileValidationErrors({})).toBe(false);
		});
	});

	describe('mergeProfileFromForm', () => {
		it('maps empty strings to null profile fields', () => {
			expect(
				helpers.mergeProfileFromForm(
					{ first_name: 'Old', last_name: 'Name', phone_number: '0612345678', avatar_url: null },
					{ first_name: '', last_name: 'Bakker', phone_number: '' },
				),
			).toEqual({
				first_name: null,
				last_name: 'Bakker',
				phone_number: null,
				avatar_url: null,
			});
		});
	});

	describe('mergeAvatarIntoProfile', () => {
		it('updates avatar url on profile', () => {
			expect(
				helpers.mergeAvatarIntoProfile(
					{ first_name: 'Anna', last_name: null, phone_number: null, avatar_url: null },
					'https://example.com/avatar.png',
				),
			).toEqual({
				first_name: 'Anna',
				last_name: null,
				phone_number: null,
				avatar_url: 'https://example.com/avatar.png',
			});
		});
	});

	describe('shouldAbortAvatarUpload', () => {
		it('returns true when no files are selected', () => {
			expect(helpers.shouldAbortAvatarUpload(null)).toBe(true);
			expect(helpers.shouldAbortAvatarUpload({ length: 0 } as FileList)).toBe(true);
		});

		it('returns false when files are selected', () => {
			expect(helpers.shouldAbortAvatarUpload({ length: 1 } as FileList)).toBe(false);
		});
	});

	describe('resolveDeleteAccountToastKind', () => {
		it('maps known delete account errors', () => {
			expect(helpers.resolveDeleteAccountToastKind('last admin', 'last_site_admin')).toBe('last-site-admin');
			expect(helpers.resolveDeleteAccountToastKind('Sessie verlopen')).toBe('session-expired');
			expect(helpers.resolveDeleteAccountToastKind('other')).toBe('generic-error');
		});
	});

	describe('resolveAvatarUploadOutcome', () => {
		it('returns error when upload fails', () => {
			expect(helpers.resolveAvatarUploadOutcome('upload failed', null, null)).toBe('error');
		});

		it('returns success when profile and avatar url exist', () => {
			expect(
				helpers.resolveAvatarUploadOutcome(
					null,
					{ first_name: 'Ada', last_name: null, phone_number: null, avatar_url: null },
					'url',
				),
			).toBe('success');
		});

		it('returns skipped when profile or avatar url is missing', () => {
			expect(helpers.resolveAvatarUploadOutcome(null, null, 'url')).toBe('skipped');
		});
	});

	describe('applyAvatarUploadOutcome', () => {
		it('shows error toast for failed uploads', () => {
			toastCalls.length = 0;
			helpers.applyAvatarUploadOutcome({
				outcome: 'error',
				error: 'upload failed',
				profile: null,
				avatarUrl: null,
				setProfile: () => {},
			});
			expect(toastCalls).toEqual([
				{ kind: 'error', message: 'Fout bij uploaden avatar', description: 'upload failed' },
			]);
		});

		it('updates profile and shows success toast on success', () => {
			toastCalls.length = 0;
			const state = { avatarUrl: null as string | null, profileUpdated: false };
			const profile = { first_name: 'Ada', last_name: null, phone_number: null, avatar_url: null };
			const originalWindow = globalThis.window;
			globalThis.window = {
				dispatchEvent: () => {
					state.profileUpdated = true;
					return true;
				},
			} as unknown as Window & typeof globalThis;

			helpers.applyAvatarUploadOutcome({
				outcome: 'success',
				error: null,
				profile,
				avatarUrl: 'https://example.com/avatar.png',
				setProfile: (value) => {
					const nextProfile = typeof value === 'function' ? value(profile) : value;
					state.avatarUrl = nextProfile?.avatar_url ?? null;
				},
			});

			globalThis.window = originalWindow;
			expect(state.avatarUrl).toBe('https://example.com/avatar.png');
			expect(state.profileUpdated).toBe(true);
			expect(toastCalls).toEqual([{ kind: 'success', message: 'Avatar opgeslagen!' }]);
		});

		it('does nothing for skipped uploads', () => {
			toastCalls.length = 0;
			let profileChanged = false;
			helpers.applyAvatarUploadOutcome({
				outcome: 'skipped',
				error: null,
				profile: null,
				avatarUrl: null,
				setProfile: () => {
					profileChanged = true;
				},
			});
			expect(profileChanged).toBe(false);
			expect(toastCalls).toHaveLength(0);
		});
	});
});
