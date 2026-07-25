import type { SlotWithStatus } from '@/lib/agreementSlots';
import { formatTime } from '@/lib/time/time-format';

export function isTeacherSlotSelected(
	selectedSlot: Pick<SlotWithStatus, 'day_of_week' | 'start_time'> | null | undefined,
	slot: Pick<SlotWithStatus, 'day_of_week' | 'start_time'>,
): boolean {
	return selectedSlot?.day_of_week === slot.day_of_week && selectedSlot?.start_time === slot.start_time;
}

export function isCurrentAgreementTeacherSlot(
	currentAgreementSlot: { day_of_week: number; start_time: string } | null | undefined,
	slot: Pick<SlotWithStatus, 'day_of_week' | 'start_time'>,
): boolean {
	return (
		currentAgreementSlot != null &&
		currentAgreementSlot.day_of_week === slot.day_of_week &&
		formatTime(currentAgreementSlot.start_time) === formatTime(slot.start_time)
	);
}

export function getTeacherSlotStatusTitle(
	slot: Pick<SlotWithStatus, 'status' | 'occupiedOccurrences' | 'totalOccurrences'>,
): string {
	if (slot.status === 'partial') {
		return `Deels bezet (${slot.occupiedOccurrences}/${slot.totalOccurrences} momenten)`;
	}
	if (slot.status === 'occupied') return 'Bezet';
	return 'Vrij';
}

export function buildTeacherSlotButtonTitle(
	slot: Pick<SlotWithStatus, 'status' | 'occupiedOccurrences' | 'totalOccurrences'>,
	isCurrentAgreementSlot: boolean,
	statusTitle: string,
): string {
	const prefix = isCurrentAgreementSlot ? 'Huidige slot van deze overeenkomst. ' : '';
	const partialSuffix = slot.status === 'partial' ? ` (${slot.occupiedOccurrences}/${slot.totalOccurrences})` : '';
	return `${prefix}${statusTitle}${partialSuffix}`;
}

export function getTeacherSlotButtonClass(input: {
	isOccupied: boolean;
	isSelected: boolean;
	isCurrentAgreementSlot: boolean;
	status: SlotWithStatus['status'];
}): string {
	const classes = ['rounded border px-2 py-1 text-xs transition-colors inline-flex items-center gap-1.5'];
	if (input.isOccupied) classes.push('cursor-not-allowed bg-muted opacity-60');
	else classes.push('hover:bg-accent');
	if (input.isSelected) classes.push('ring-2 ring-primary');
	if (input.isCurrentAgreementSlot) {
		classes.push('bg-primary/30 dark:bg-primary/40 border-primary dark:border-primary');
	}
	if (input.status === 'free' && !input.isCurrentAgreementSlot) {
		classes.push('border-green-200 dark:border-green-800');
	}
	if (input.status === 'partial' && !input.isCurrentAgreementSlot) {
		classes.push('border-amber-200 dark:border-amber-800');
	}
	return classes.join(' ');
}
