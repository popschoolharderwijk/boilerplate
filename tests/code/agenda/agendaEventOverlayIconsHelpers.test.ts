import { describe, expect, it } from 'bun:test';
import {
	getCancelledOverlayIconClass,
	shouldShowCancelledOverlayIcon,
	shouldShowChangedOverlayIcon,
	shouldShowRecurringOverlayIcon,
} from '../../../src/components/agenda/agendaEventOverlayIconsHelpers';

describe('overlay icon visibility helpers', () => {
	it('shows recurring icon only when recurring', () => {
		expect(shouldShowRecurringOverlayIcon(true)).toBe(true);
		expect(shouldShowRecurringOverlayIcon(false)).toBe(false);
	});

	it('shows cancelled icon only when cancelled', () => {
		expect(shouldShowCancelledOverlayIcon(true)).toBe(true);
		expect(shouldShowCancelledOverlayIcon(false)).toBe(false);
	});

	it('shows changed icon only when changed and not cancelled', () => {
		expect(shouldShowChangedOverlayIcon(false, true)).toBe(true);
		expect(shouldShowChangedOverlayIcon(true, true)).toBe(false);
	});
});

describe('getCancelledOverlayIconClass', () => {
	it('returns teacher cancelled class', () => {
		expect(getCancelledOverlayIconClass(true, 'text-white')).toBe('text-orange-500');
	});

	it('returns default icon class', () => {
		expect(getCancelledOverlayIconClass(false, 'text-white')).toBe('text-white');
	});
});
