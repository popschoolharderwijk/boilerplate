import { describe, expect, it } from 'bun:test';
import {
	buildAccountPageViewModel,
	resetAccountDeleteDialogState,
} from '../../../src/lib/account/accountPageShellHelpers';

describe('buildAccountPageViewModel', () => {
	it('returns the provided account page fields', () => {
		expect(
			buildAccountPageViewModel({
				user: { id: 'user-1', email: 'user@test.nl' },
				loading: false,
				saving: false,
				profile: null,
				formData: { first_name: 'Ada', last_name: 'Lovelace', phone_number: '' },
				errors: {},
				deleteDialogOpen: false,
				deleteConfirmEmail: '',
				deleting: false,
				userInitials: 'AL',
			}).userInitials,
		).toBe('AL');
	});
});

describe('resetAccountDeleteDialogState', () => {
	it('returns closed dialog defaults', () => {
		expect(resetAccountDeleteDialogState()).toEqual({
			deleteDialogOpen: false,
			deleteConfirmEmail: '',
		});
	});
});
