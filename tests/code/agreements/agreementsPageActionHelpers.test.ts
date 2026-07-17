import { beforeAll, describe, expect, it, mock } from 'bun:test';

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

describe('runAgreementPageAction', () => {
	let runAgreementPageAction: typeof import('../../../src/lib/agreements/agreementsPageActionHelpers').runAgreementPageAction;

	beforeAll(async () => {
		({ runAgreementPageAction } = await import('../../../src/lib/agreements/agreementsPageActionHelpers'));
	});

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

	it('clears dialog and reloads on confirm-delete success', async () => {
		deleteError = null;
		let dialogValue: unknown = { open: true, agreement: { id: 'agreement-1' } };
		let reloaded = false;
		await runAgreementPageAction(
			{ kind: 'confirm-delete' },
			{ open: true, agreement: { id: 'agreement-1' } as never },
			{
				navigate: () => {},
				setDeleteDialog: (value) => {
					dialogValue = value;
				},
				reloadAgreements: () => {
					reloaded = true;
				},
			},
		);
		expect(dialogValue).toBeNull();
		expect(reloaded).toBe(true);
	});

	it('throws when confirm-delete fails', async () => {
		deleteError = { message: 'delete failed' };
		await expect(
			runAgreementPageAction(
				{ kind: 'confirm-delete' },
				{ open: true, agreement: { id: 'agreement-1' } as never },
				{
					navigate: () => {},
					setDeleteDialog: () => {},
					reloadAgreements: () => {},
				},
			),
		).rejects.toThrow('delete failed');
	});
});
