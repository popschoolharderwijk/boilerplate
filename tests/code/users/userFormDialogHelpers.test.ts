import { describe, expect, it } from 'bun:test';
import {
	applyUserFormDialogSubmitSuccess,
	buildUserFormStateForOpen,
	handleUserFormDialogCancel,
	handleUserFormDialogOpenChange,
	resolveUserFormEditContext,
} from '../../../src/lib/users/userFormDialogHelpers';
import type { UserFormState } from '../../../src/lib/users/userFormHelpers';

const emptyForm: UserFormState = {
	email: '',
	first_name: '',
	last_name: '',
	phone_number: '',
	role: null,
};

describe('buildUserFormStateForOpen', () => {
	it('returns the empty form for create mode', () => {
		expect(buildUserFormStateForOpen(undefined, emptyForm)).toEqual(emptyForm);
	});

	it('maps nullable user fields to form defaults', () => {
		expect(
			buildUserFormStateForOpen(
				{
					email: 'jan@example.com',
					first_name: null,
					last_name: 'Jansen',
					phone_number: null,
					role: 'admin',
				},
				emptyForm,
			),
		).toEqual({
			email: 'jan@example.com',
			first_name: '',
			last_name: 'Jansen',
			phone_number: '',
			role: 'admin',
		});
	});
});

describe('handleUserFormDialogCancel', () => {
	it('ignores cancel while saving', () => {
		let closed = false;
		handleUserFormDialogCancel(
			true,
			() => {},
			emptyForm,
			(open) => {
				closed = !open;
			},
		);
		expect(closed).toBe(false);
	});

	it('resets the form and closes the dialog when not saving', () => {
		let nextForm: UserFormState = {
			email: 'jan@example.com',
			first_name: 'Jan',
			last_name: 'Jansen',
			phone_number: '',
			role: null,
		};
		let closed = false;
		handleUserFormDialogCancel(
			false,
			(form) => {
				nextForm = form;
			},
			emptyForm,
			(open) => {
				closed = !open;
			},
		);
		expect(nextForm).toEqual(emptyForm);
		expect(closed).toBe(true);
	});
});

describe('handleUserFormDialogOpenChange', () => {
	it('ignores open changes while saving', () => {
		let closed = false;
		handleUserFormDialogOpenChange(
			true,
			false,
			() => {},
			emptyForm,
			(open) => {
				closed = !open;
			},
		);
		expect(closed).toBe(false);
	});

	it('resets the form and closes the dialog when not saving', () => {
		let nextForm: UserFormState = {
			email: 'jan@example.com',
			first_name: 'Jan',
			last_name: 'Jansen',
			phone_number: '',
			role: null,
		};
		let closed = false;
		handleUserFormDialogOpenChange(
			false,
			false,
			(form) => {
				nextForm = form;
			},
			emptyForm,
			(open) => {
				closed = !open;
			},
		);
		expect(nextForm).toEqual(emptyForm);
		expect(closed).toBe(true);
	});
});

describe('resolveUserFormEditContext', () => {
	it('returns null for create mode', () => {
		expect(resolveUserFormEditContext(false, undefined)).toBeNull();
	});

	it('returns null when edit mode has no user', () => {
		expect(resolveUserFormEditContext(true, undefined)).toBeNull();
	});

	it('returns the edit context for edit mode', () => {
		expect(
			resolveUserFormEditContext(true, {
				user_id: 'user-1',
				role: 'admin',
			}),
		).toEqual({
			user_id: 'user-1',
			role: 'admin',
		});
	});
});

describe('applyUserFormDialogSubmitSuccess', () => {
	it('closes the dialog and passes the created user on create', () => {
		let nextForm: UserFormState = {
			email: 'jan@example.com',
			first_name: 'Jan',
			last_name: 'Jansen',
			phone_number: '',
			role: null,
		};
		let closed = false;
		let createdUserId: string | undefined;
		applyUserFormDialogSubmitSuccess({
			result: {
				ok: true,
				mode: 'create',
				createdUser: {
					user_id: 'user-1',
					email: 'jan@example.com',
					first_name: 'Jan',
					last_name: 'Jansen',
					phone_number: null,
					avatar_url: null,
				},
			},
			setForm: (form) => {
				nextForm = form;
			},
			emptyForm,
			onOpenChange: (open) => {
				closed = !open;
			},
			onSuccess: (createdUser) => {
				createdUserId = createdUser?.user_id;
			},
		});
		expect(nextForm).toEqual(emptyForm);
		expect(closed).toBe(true);
		expect(createdUserId).toBe('user-1');
	});

	it('closes the dialog without a created user on edit', () => {
		let successCalled = false;
		let createdUserId: string | undefined = 'pending';
		applyUserFormDialogSubmitSuccess({
			result: {
				ok: true,
				mode: 'edit',
			},
			setForm: () => {},
			emptyForm,
			onOpenChange: () => {},
			onSuccess: (createdUser) => {
				successCalled = true;
				createdUserId = createdUser?.user_id;
			},
		});
		expect(successCalled).toBe(true);
		expect(createdUserId).toBeUndefined();
	});
});
