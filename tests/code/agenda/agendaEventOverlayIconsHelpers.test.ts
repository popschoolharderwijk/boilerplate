import { describe, expect, it } from 'bun:test';
import {
	getCancelledOverlayIconClass,
	shouldShowChangedOverlayIcon,
} from '../../../src/components/agenda/agendaEventOverlayIconsHelpers';

describe('overlay icon visibility helpers', () => {
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
