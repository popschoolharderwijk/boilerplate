import { describe, expect, it } from 'bun:test';
import { formatPartialSlotOccupancySuffix } from '../../../src/lib/agreements/partialSlotConfirmDialogHelpers';

describe('formatPartialSlotOccupancySuffix', () => {
	it('returns an empty string when counts are missing', () => {
		expect(formatPartialSlotOccupancySuffix(null)).toBe('');
	});

	it('formats occupied and total occurrences', () => {
		expect(
			formatPartialSlotOccupancySuffix({
				totalOccurrences: 8,
				occupiedOccurrences: 3,
			} as Parameters<typeof formatPartialSlotOccupancySuffix>[0]),
		).toBe(' (3 van 8 momenten bezet)');
	});
});
