import { describe, expect, it } from 'bun:test';
import { getConfirmStepHeading, getConfirmStepSubtitle } from '../../../src/lib/agreements/confirmStepPanelHelpers';

describe('getConfirmStepHeading', () => {
	it('returns the edit heading when there are changes', () => {
		expect(getConfirmStepHeading(true)).toBe('Controleer je wijzigingen');
	});

	it('returns the overview heading when there are no changes', () => {
		expect(getConfirmStepHeading(false)).toBe('Overzicht');
	});
});

describe('getConfirmStepSubtitle', () => {
	it('returns the create-mode subtitle', () => {
		expect(getConfirmStepSubtitle(false, false)).toBe(
			'Bekijk de samenvatting en bevestig om de overeenkomst aan te maken.',
		);
	});

	it('returns the edit subtitle with changes', () => {
		expect(getConfirmStepSubtitle(true, true)).toBe('Bekijk de wijzigingen en bevestig om op te slaan.');
	});

	it('returns an empty subtitle in edit mode without changes', () => {
		expect(getConfirmStepSubtitle(true, false)).toBe('');
	});
});
