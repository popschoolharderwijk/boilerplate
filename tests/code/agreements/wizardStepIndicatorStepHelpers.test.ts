import { describe, expect, it } from 'bun:test';
import {
	createWizardStepIndicatorClickHandler,
	getWizardStepIndicatorButtonClass,
	resolveWizardStepIndicatorIconKind,
	shouldShowWizardStepConnector,
} from '../../../src/components/agreements/wizardStepIndicatorStepHelpers';

describe('getWizardStepIndicatorButtonClass', () => {
	it('returns interactive classes when navigation is allowed', () => {
		expect(getWizardStepIndicatorButtonClass(true)).toBe(
			'flex flex-col items-center transition-opacity cursor-pointer hover:opacity-80',
		);
	});

	it('returns disabled classes when navigation is blocked', () => {
		expect(getWizardStepIndicatorButtonClass(false)).toBe(
			'flex flex-col items-center transition-opacity cursor-not-allowed opacity-60',
		);
	});
});

describe('shouldShowWizardStepConnector', () => {
	it('shows connector before the last step', () => {
		expect(shouldShowWizardStepConnector(0, 4)).toBe(true);
	});

	it('hides connector after the last step', () => {
		expect(shouldShowWizardStepConnector(3, 4)).toBe(false);
	});
});

describe('createWizardStepIndicatorClickHandler', () => {
	it('calls onStepChange when navigation is allowed', () => {
		const steps: string[] = [];
		const handler = createWizardStepIndicatorClickHandler(true, (step) => steps.push(step), 'period');
		handler();
		expect(steps).toEqual(['period']);
	});

	it('ignores clicks when navigation is blocked', () => {
		const steps: string[] = [];
		const handler = createWizardStepIndicatorClickHandler(false, (step) => steps.push(step), 'period');
		handler();
		expect(steps).toEqual([]);
	});
});

describe('resolveWizardStepIndicatorIconKind', () => {
	it('returns check for completed steps', () => {
		expect(resolveWizardStepIndicatorIconKind(true)).toBe('check');
	});

	it('returns step icon for incomplete steps', () => {
		expect(resolveWizardStepIndicatorIconKind(false)).toBe('step-icon');
	});
});
