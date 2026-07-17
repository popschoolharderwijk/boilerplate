import { describe, expect, it } from 'bun:test';
import {
	buildProjectLabelSelectKey,
	getProjectLabelSelectPlaceholder,
	shouldShowProjectActiveCheckbox,
} from '../../../src/lib/projects/projectFormFieldsHelpers';

describe('buildProjectLabelSelectKey', () => {
	it('builds a stable key for new projects', () => {
		expect(buildProjectLabelSelectKey(undefined, 2, 'label-1')).toBe('new-2-label-1');
	});

	it('builds a stable key for existing projects', () => {
		expect(buildProjectLabelSelectKey('proj-1', 3, 'label-2')).toBe('proj-1-3-label-2');
	});
});

describe('shouldShowProjectActiveCheckbox', () => {
	it('shows checkbox when editing', () => {
		expect(shouldShowProjectActiveCheckbox(true)).toBe(true);
	});

	it('hides checkbox when creating', () => {
		expect(shouldShowProjectActiveCheckbox(false)).toBe(false);
	});
});

describe('getProjectLabelSelectPlaceholder', () => {
	it('returns loading placeholder while labels load', () => {
		expect(getProjectLabelSelectPlaceholder(true)).toBe('Labels laden...');
	});

	it('returns selection placeholder when labels are ready', () => {
		expect(getProjectLabelSelectPlaceholder(false)).toBe('Selecteer een label');
	});
});
