import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
	buildEmptyProjectFormState,
	mergeProjectFormLabelAfterLoad,
	resolveProjectFormDialogInitialState,
	runProjectFormDialogSubmit,
} from '../../../src/lib/projects/projectFormDialogHelpers';

const toastCalls: { kind: 'error' | 'success'; message: string; description?: string }[] = [];
let insertError: { message: string } | null = null;
let updateError: { message: string } | null = null;
let lastInsertPayload: Record<string, unknown> | null = null;
let lastUpdatePayload: Record<string, unknown> | null = null;

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

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		from: () => ({
			insert: async (payload: Record<string, unknown>) => {
				lastInsertPayload = payload;
				return { error: insertError };
			},
			update: (payload: Record<string, unknown>) => ({
				eq: async () => {
					lastUpdatePayload = payload;
					return { error: updateError };
				},
			}),
		}),
	},
}));

mock.module('@/integrations/supabase/client', () => ({
	supabase: {
		from: () => ({
			insert: async (payload: Record<string, unknown>) => {
				lastInsertPayload = payload;
				return { error: insertError };
			},
			update: (payload: Record<string, unknown>) => ({
				eq: async () => {
					lastUpdatePayload = payload;
					return { error: updateError };
				},
			}),
		}),
	},
}));

describe('buildEmptyProjectFormState', () => {
	it('returns the default create form state', () => {
		expect(buildEmptyProjectFormState()).toEqual({
			name: '',
			label_id: '',
			owner_user_id: '',
			cost_center: '',
			description: '',
			is_active: true,
		});
	});
});

describe('resolveProjectFormDialogInitialState', () => {
	it('returns empty form state for create mode', () => {
		expect(resolveProjectFormDialogInitialState(null)).toEqual({
			name: '',
			label_id: '',
			owner_user_id: '',
			cost_center: '',
			description: '',
			is_active: true,
		});
	});

	it('maps project fields for edit mode', () => {
		expect(
			resolveProjectFormDialogInitialState({
				id: 'proj-1',
				name: 'Project A',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: null,
				description: null,
				is_active: true,
			}),
		).toEqual({
			id: 'proj-1',
			name: 'Project A',
			label_id: 'label-1',
			owner_user_id: 'owner-1',
			cost_center: '',
			description: '',
			is_active: true,
		});
	});
});

describe('mergeProjectFormLabelAfterLoad', () => {
	it('keeps the form unchanged when no label id is provided', () => {
		const form = {
			name: 'Project A',
			label_id: '',
			owner_user_id: 'owner-1',
			cost_center: '',
			description: '',
			is_active: true,
		};
		expect(mergeProjectFormLabelAfterLoad(form, undefined)).toEqual(form);
	});

	it('sets the label id after labels are loaded', () => {
		expect(
			mergeProjectFormLabelAfterLoad(
				{
					id: 'proj-1',
					name: 'Project A',
					label_id: '',
					owner_user_id: 'owner-1',
					cost_center: '',
					description: '',
					is_active: true,
				},
				'label-1',
			),
		).toEqual({
			id: 'proj-1',
			name: 'Project A',
			label_id: 'label-1',
			owner_user_id: 'owner-1',
			cost_center: '',
			description: '',
			is_active: true,
		});
	});
});

describe('runProjectFormDialogSubmit', () => {
	beforeAll(async () => {
		await import('../../../src/lib/projects/projectFormDialogHelpers');
	});

	beforeEach(() => {
		toastCalls.length = 0;
		insertError = null;
		updateError = null;
		lastInsertPayload = null;
		lastUpdatePayload = null;
	});

	it('shows validation toast when required fields are missing', async () => {
		let dialogOpen = true;
		let saved = false;
		await runProjectFormDialogSubmit({
			form: buildEmptyProjectFormState(),
			isEditing: false,
			onOpenChange: (open) => {
				dialogOpen = open;
			},
			onSaved: () => {
				saved = true;
			},
		});
		expect(dialogOpen).toBe(true);
		expect(saved).toBe(false);
		expect(toastCalls).toEqual([{ kind: 'error', message: 'Vul alle verplichte velden in' }]);
	});

	it('creates project with trimmed payload and closes dialog on success', async () => {
		let dialogOpen = true;
		let saved = false;
		await runProjectFormDialogSubmit({
			form: {
				name: '  Project A  ',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: '  ',
				description: '  ',
				is_active: false,
			},
			isEditing: false,
			onOpenChange: (open) => {
				dialogOpen = open;
			},
			onSaved: () => {
				saved = true;
			},
		});
		expect(dialogOpen).toBe(false);
		expect(saved).toBe(true);
		expect(lastInsertPayload).toEqual({
			name: 'Project A',
			label_id: 'label-1',
			owner_user_id: 'owner-1',
			cost_center: null,
			description: null,
			is_active: false,
		});
		expect(toastCalls).toEqual([{ kind: 'success', message: 'Project aangemaakt' }]);
	});

	it('updates project and closes dialog on success', async () => {
		let dialogOpen = true;
		let saved = false;
		await runProjectFormDialogSubmit({
			form: {
				id: 'proj-1',
				name: 'Project A',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: '',
				description: '',
				is_active: true,
			},
			isEditing: true,
			onOpenChange: (open) => {
				dialogOpen = open;
			},
			onSaved: () => {
				saved = true;
			},
		});
		expect(dialogOpen).toBe(false);
		expect(saved).toBe(true);
		expect(lastUpdatePayload).toEqual({
			name: 'Project A',
			label_id: 'label-1',
			owner_user_id: 'owner-1',
			cost_center: null,
			description: null,
			is_active: true,
		});
		expect(toastCalls).toEqual([{ kind: 'success', message: 'Project bijgewerkt' }]);
	});

	it('shows create error toast when insert fails', async () => {
		insertError = { message: 'insert failed' };
		let dialogOpen = true;
		await runProjectFormDialogSubmit({
			form: {
				name: 'Project A',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: '',
				description: '',
				is_active: true,
			},
			isEditing: false,
			onOpenChange: (open) => {
				dialogOpen = open;
			},
			onSaved: () => {},
		});
		expect(dialogOpen).toBe(true);
		expect(toastCalls).toEqual([
			{ kind: 'error', message: 'Fout bij aanmaken project', description: 'insert failed' },
		]);
	});

	it('shows edit error toast when update fails', async () => {
		updateError = { message: 'update failed' };
		let dialogOpen = true;
		await runProjectFormDialogSubmit({
			form: {
				id: 'proj-1',
				name: 'Project A',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: '',
				description: '',
				is_active: true,
			},
			isEditing: true,
			onOpenChange: (open) => {
				dialogOpen = open;
			},
			onSaved: () => {},
		});
		expect(dialogOpen).toBe(true);
		expect(toastCalls).toEqual([
			{ kind: 'error', message: 'Fout bij bijwerken project', description: 'update failed' },
		]);
	});
});
