import type { SlotWithStatus } from '@/lib/agreementSlots';

export function formatPartialSlotOccupancySuffix(slot: SlotWithStatus | null): string {
	if (slot?.totalOccurrences == null || slot?.occupiedOccurrences == null) {
		return '';
	}

	return ` (${slot.occupiedOccurrences} van ${slot.totalOccurrences} momenten bezet)`;
}
