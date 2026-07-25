import { describe, expect, it } from 'bun:test';
import {
	getWizardStepCircleClass,
	getWizardStepConnectorClass,
	getWizardStepLabelClass,
	getWizardStepVisualState,
} from '../../../src/components/agreements/wizardStepIndicatorHelpers';

describe('getWizardStepVisualState', () => {
	it('marks earlier steps completed and navigable', () => {
		expect(getWizardStepVisualState(0, 2, 2, false)).toEqual({
			isCompleted: true,
			wasReached: true,
			canNavigate: true,
		});
	});

	it('blocks navigation for untouched future steps', () => {
		expect(getWizardStepVisualState(3, 1, 1, false)).toEqual({
			isCompleted: false,
			wasReached: false,
			canNavigate: false,
		});
	});
});

describe('wizard step class helpers', () => {
	it('returns active circle class', () => {
		expect(getWizardStepCircleClass(true, false, true)).toBe('border-primary bg-primary text-primary-foreground');
	});

	it('returns completed circle class', () => {
		expect(getWizardStepCircleClass(false, true, true)).toBe('border-primary bg-transparent text-primary');
	});

	it('returns reached and default circle classes', () => {
		expect(getWizardStepCircleClass(false, false, true)).toBe('border-primary/50 bg-transparent text-primary/70');
		expect(getWizardStepCircleClass(false, false, false)).toBe('border-muted-foreground/30 text-muted-foreground');
	});

	it('returns label classes', () => {
		expect(getWizardStepLabelClass(true, false)).toBe('text-primary');
		expect(getWizardStepLabelClass(false, true)).toBe('text-primary/70');
		expect(getWizardStepLabelClass(false, false)).toBe('text-muted-foreground');
	});

	it('returns connector classes', () => {
		expect(getWizardStepConnectorClass(true, true)).toBe('bg-primary');
		expect(getWizardStepConnectorClass(false, true)).toBe('bg-primary/50');
		expect(getWizardStepConnectorClass(false, false)).toBe('bg-muted-foreground/30');
	});
});
