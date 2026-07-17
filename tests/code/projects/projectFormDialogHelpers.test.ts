import { describe, expect, it } from 'bun:test';
import {
	buildEmptyProjectFormState,
	buildProjectFormSavePayload,
	buildProjectFormStateFromProject,
	getProjectFormSaveErrorMessage,
	mergeProjectFormLabelAfterLoad,
	resolveProjectFormDialogInitialState,
	validateProjectFormInput,
} from '../../../src/lib/projects/projectFormDialogHelpers';

describe('validateProjectFormInput', () => {
	it('returns true for a complete form', () => {
		expect(
			validateProjectFormInput({
				name: 'Project A',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: '',
				description: '',
				is_active: true,
			}),
		).toBe(true);
	});

	it('returns false when required fields are missing', () => {
		expect(
			validateProjectFormInput({
				name: ' ',
				label_id: '',
				owner_user_id: '',
				cost_center: '',
				description: '',
				is_active: true,
			}),
		).toBe(false);
	});
});

describe('buildProjectFormSavePayload', () => {
	it('trims text fields and maps empty optional fields to null', () => {
		expect(
			buildProjectFormSavePayload({
				name: '  Project A  ',
				label_id: 'label-1',
				owner_user_id: 'owner-1',
				cost_center: '  ',
				description: '  ',
				is_active: false,
			}),
		).toEqual({
			name: 'Project A',
			label_id: 'label-1',
			owner_user_id: 'owner-1',
			cost_center: null,
			description: null,
			is_active: false,
		});
	});
});

describe('buildProjectFormStateFromProject', () => {
	it('maps nullable project fields to form defaults', () => {
		expect(
			buildProjectFormStateFromProject({
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

describe('getProjectFormSaveErrorMessage', () => {
	it('returns the edit error title', () => {
		expect(getProjectFormSaveErrorMessage(true)).toBe('Fout bij bijwerken project');
	});

	it('returns the create error title', () => {
		expect(getProjectFormSaveErrorMessage(false)).toBe('Fout bij aanmaken project');
	});
});
