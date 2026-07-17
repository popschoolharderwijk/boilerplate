import type { Tables } from '@/integrations/supabase/types';
import { AVAILABILITY_CONFIG, DEFAULT_END_TIME, DEFAULT_START_TIME } from '@/lib/availability';

export interface AvailabilityBlock {
	id: string;
	displayDay: number;
	startTime: string;
	endTime: string;
	topPercent: number;
	heightPercent: number;
}

export interface AvailabilityTimeForm {
	start_time: string;
	end_time: string;
}

export const DEFAULT_AVAILABILITY_TIME_FORM: AvailabilityTimeForm = {
	start_time: DEFAULT_START_TIME,
	end_time: DEFAULT_END_TIME,
};

export function generateAvailabilityTimeSlots(): string[] {
	const slots: string[] = [];
	const totalMinutes = (AVAILABILITY_CONFIG.END_HOUR - AVAILABILITY_CONFIG.START_HOUR) * 60;
	const slotCount = Math.floor(totalMinutes / AVAILABILITY_CONFIG.SLOT_DURATION_MINUTES);
	for (let i = 0; i <= slotCount; i++) {
		const totalMinutesFromStart = i * AVAILABILITY_CONFIG.SLOT_DURATION_MINUTES;
		const hour = AVAILABILITY_CONFIG.START_HOUR + Math.floor(totalMinutesFromStart / 60);
		const minute = totalMinutesFromStart % 60;
		slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
	}
	return slots;
}

export function buildAvailabilityHourLabels(): number[] {
	return Array.from(
		{ length: AVAILABILITY_CONFIG.END_HOUR - AVAILABILITY_CONFIG.START_HOUR + 1 },
		(_, index) => AVAILABILITY_CONFIG.START_HOUR + index,
	);
}

export function buildAvailabilityBlocks(availability: Tables<'teacher_availability'>[]): AvailabilityBlock[] {
	const totalMinutes = (AVAILABILITY_CONFIG.END_HOUR - AVAILABILITY_CONFIG.START_HOUR) * 60;

	return availability.map((entry) => {
		const displayDay = entry.day_of_week === 0 ? 6 : entry.day_of_week - 1;
		const [startHour, startMin] = entry.start_time.split(':').map(Number);
		const [endHour, endMin] = entry.end_time.split(':').map(Number);
		const startMinutes = (startHour - AVAILABILITY_CONFIG.START_HOUR) * 60 + startMin;
		const endMinutes = (endHour - AVAILABILITY_CONFIG.START_HOUR) * 60 + endMin;
		const topPercent = (startMinutes / totalMinutes) * 100;
		const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

		return {
			id: entry.id,
			displayDay,
			startTime: entry.start_time,
			endTime: entry.end_time,
			topPercent: Math.max(0, topPercent),
			heightPercent: Math.min(100 - topPercent, heightPercent),
		};
	});
}

export function getAvailabilityBlocksForDay(blocks: AvailabilityBlock[], displayDay: number): AvailabilityBlock[] {
	return blocks.filter((block) => block.displayDay === displayDay);
}

export function getNextAvailabilityTimeSlot(time: string, slots: number, timeSlots: string[]): string {
	const index = timeSlots.indexOf(time);
	if (index === -1 || index + slots >= timeSlots.length) {
		return timeSlots[timeSlots.length - 1];
	}
	return timeSlots[index + slots];
}

export function availabilityBlockDurationMinutes(startTime: string, endTime: string): number {
	const [startHour, startMinute] = startTime.split(':').map(Number);
	const [endHour, endMinute] = endTime.split(':').map(Number);
	return (endHour - startHour) * 60 + (endMinute - startMinute);
}

export function shouldShowAvailabilityBlockTimes(startTime: string, endTime: string): boolean {
	return availabilityBlockDurationMinutes(startTime, endTime) > 30;
}

export function isAvailabilityTimeRangeValid(startTime: string, endTime: string): boolean {
	return startTime < endTime;
}

export function findAvailabilityBlockCoveringTime(
	blocks: AvailabilityBlock[],
	time: string,
): AvailabilityBlock | undefined {
	return blocks.find((block) => block.startTime <= time && block.endTime > time);
}

export function buildAvailabilitySlotFormFromClick(time: string, timeSlots: string[]): AvailabilityTimeForm {
	return {
		start_time: time,
		end_time: getNextAvailabilityTimeSlot(time, 2, timeSlots),
	};
}

export function buildAvailabilitySlotFormFromBlock(startTime: string, endTime: string): AvailabilityTimeForm {
	return {
		start_time: startTime,
		end_time: endTime,
	};
}

export function getAvailabilityHourTopPercent(hour: number): number {
	return (
		((hour - AVAILABILITY_CONFIG.START_HOUR) / (AVAILABILITY_CONFIG.END_HOUR - AVAILABILITY_CONFIG.START_HOUR)) *
		100
	);
}

export function getAvailabilitySlotPosition(time: string): { topPercent: number; heightPercent: number } {
	const totalMinutes = (AVAILABILITY_CONFIG.END_HOUR - AVAILABILITY_CONFIG.START_HOUR) * 60;
	const [hour, minute] = time.split(':').map(Number);
	const minutesFromStart = (hour - AVAILABILITY_CONFIG.START_HOUR) * 60 + minute;
	return {
		topPercent: (minutesFromStart / totalMinutes) * 100,
		heightPercent: (30 / totalMinutes) * 100,
	};
}

export type AvailabilityDialogDescription =
	| { mode: 'edit'; dayName: string }
	| { mode: 'add'; dayName: string; startTime: string };

export function getTeacherAvailabilityCardDescription(canEdit: boolean): string {
	return canEdit ? 'Klik op lege cel om toe te voegen, op tijdslot om te wijzigen' : 'Beschikbare tijdsloten';
}

export function getAvailabilityDialogTitle(editingBlock: AvailabilityBlock | null): string {
	return editingBlock ? 'Tijdslot wijzigen' : 'Nieuw tijdslot toevoegen';
}

export function getAvailabilityDialogDescription(
	selectedSlot: { day: number; time: string } | null,
	editingBlock: AvailabilityBlock | null,
	dayNames: readonly string[],
): AvailabilityDialogDescription | null {
	if (!selectedSlot) return null;

	const dayName = dayNames[selectedSlot.day] ?? '';
	if (editingBlock) {
		return { mode: 'edit', dayName };
	}

	return { mode: 'add', dayName, startTime: selectedSlot.time };
}

export function getAvailabilityEndTimeOptions(startTime: string, timeSlots: string[]): string[] {
	return timeSlots.filter((time) => time > startTime);
}

export function getAvailabilityDialogDescriptionText(
	description: AvailabilityDialogDescription | null,
): { prefix: string; dayName: string; startTime?: string } | null {
	if (!description) return null;
	if (description.mode === 'edit') {
		return { prefix: 'Wijzig beschikbaarheid voor', dayName: description.dayName };
	}
	return {
		prefix: 'Voeg beschikbaarheid toe voor',
		dayName: description.dayName,
		startTime: description.startTime,
	};
}
