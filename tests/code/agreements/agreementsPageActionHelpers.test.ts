import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
	executeAgreementDelete,
	resolveAgreementRunActionKind,
	runAgreementPageAction,
} from '../../../src/lib/agreements/agreementsPageActionHelpers';

let deleteError: { message: string } | null = null;

mock.module('sonner', () => ({
	toast: {
		error: () => {},
		success: () => {},
	},
}));

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: () => ({
			delete: () => ({
				eq: async () => ({ error: deleteError }),
			}),
		}),
	},
}));

describe('resolveAgreementRunActionKind', () => {
	it('maps edit actions to navigate-edit', () => {
		expect(resolveAgreementRunActionKind({ kind: 'edit', agreement: { id: 'a-1' } as never })).toBe(
			'navigate-edit',
		);
	});

	it('maps delete actions to open-delete', () => {
		expect(resolveAgreementRunActionKind({ kind: 'delete', agreement: { id: 'a-1' } as never })).toBe(
			'open-delete',
		);
	});

	it('maps confirm-delete actions to confirm-delete', () => {
		expect(resolveAgreementRunActionKind({ kind: 'confirm-delete' })).toBe('confirm-delete');
	});
});

describe('runAgreementPageAction', () => {
	it('navigates on edit action', async () => {
		let navigatedPath = '';
		await runAgreementPageAction({ kind: 'edit', agreement: { id: 'agreement-1' } as never }, null, {
			navigate: (path) => {
				navigatedPath = path;
			},
			setDeleteDialog: () => {},
			reloadAgreements: () => {},
		});
		expect(navigatedPath).toBe('/agreements/agreement-1');
	});

	it('opens delete dialog on delete action', async () => {
		let dialogOpen = false;
		let dialogAgreementId = '';
		const agreement = { id: 'agreement-1' } as never;
		await runAgreementPageAction({ kind: 'delete', agreement }, null, {
			navigate: () => {},
			setDeleteDialog: (value) => {
				dialogOpen = value?.open ?? false;
				dialogAgreementId = value?.agreement.id ?? '';
			},
			reloadAgreements: () => {},
		});
		expect(dialogOpen).toBe(true);
		expect(dialogAgreementId).toBe('agreement-1');
	});

	it('does nothing on confirm-delete without dialog state', async () => {
		let reloaded = false;
		await runAgreementPageAction({ kind: 'confirm-delete' }, null, {
			navigate: () => {},
			setDeleteDialog: () => {},
			reloadAgreements: () => {
				reloaded = true;
			},
		});
		expect(reloaded).toBe(false);
	});
});

describe('executeAgreementDelete', () => {
	beforeEach(() => {
		deleteError = null;
	});

	it('clears dialog and reloads on success', async () => {
		let dialogValue: unknown = 'open';
		let reloaded = false;
		await executeAgreementDelete('agreement-1', {
			setDeleteDialog: (value) => {
				dialogValue = value;
			},
			reloadAgreements: () => {
				reloaded = true;
			},
		});
		expect(dialogValue).toBeNull();
		expect(reloaded).toBe(true);
	});

	it('throws when delete fails', async () => {
		deleteError = { message: 'delete failed' };
		await expect(
			executeAgreementDelete('agreement-1', {
				setDeleteDialog: () => {},
				reloadAgreements: () => {},
			}),
		).rejects.toThrow('delete failed');
	});
});
