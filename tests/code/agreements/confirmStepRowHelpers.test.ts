import { describe, expect, it } from 'bun:test';
import { resolveConfirmStepRowDisplay } from '../../../src/lib/agreements/confirmStepRowHelpers';

describe('resolveConfirmStepRowDisplay', () => {
	it('prefers children over new and old values', () => {
		expect(
			resolveConfirmStepRowDisplay({
				children: 'child',
				newValue: 'new',
				oldValue: 'old',
			}),
		).toEqual({
			value: 'child',
			isMuted: false,
			showChangedIcon: false,
		});
	});

	it('marks unchanged rows as muted', () => {
		expect(
			resolveConfirmStepRowDisplay({
				newValue: 'same',
				changed: false,
			}),
		).toEqual({
			value: 'same',
			isMuted: true,
			showChangedIcon: false,
		});
	});

	it('shows changed icon for changed rows', () => {
		expect(
			resolveConfirmStepRowDisplay({
				newValue: 'updated',
				changed: true,
			}),
		).toEqual({
			value: 'updated',
			isMuted: false,
			showChangedIcon: true,
		});
	});

	it('hides changed icon when hideIcon is true', () => {
		expect(
			resolveConfirmStepRowDisplay({
				newValue: 'updated',
				changed: true,
				hideIcon: true,
			}).showChangedIcon,
		).toBe(false);
	});
});
