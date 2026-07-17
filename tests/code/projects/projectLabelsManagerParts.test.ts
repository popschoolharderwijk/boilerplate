import { describe, expect, it } from 'bun:test';
import {
	shouldShowProjectLabelsEmpty,
	shouldShowProjectLabelsList,
	shouldShowProjectLabelsLoading,
} from '../../../src/components/projects/ProjectLabelsManagerParts';

describe('shouldShowProjectLabelsLoading', () => {
	it('returns true while loading', () => {
		expect(shouldShowProjectLabelsLoading(true)).toBe(true);
	});

	it('returns false when not loading', () => {
		expect(shouldShowProjectLabelsLoading(false)).toBe(false);
	});
});

describe('shouldShowProjectLabelsEmpty', () => {
	it('returns true when loaded with no labels', () => {
		expect(shouldShowProjectLabelsEmpty(false, 0)).toBe(true);
	});

	it('returns false while loading', () => {
		expect(shouldShowProjectLabelsEmpty(true, 0)).toBe(false);
	});
});

describe('shouldShowProjectLabelsList', () => {
	it('returns true when labels exist', () => {
		expect(shouldShowProjectLabelsList(false, 2)).toBe(true);
	});

	it('returns false while loading', () => {
		expect(shouldShowProjectLabelsList(true, 2)).toBe(false);
	});
});
