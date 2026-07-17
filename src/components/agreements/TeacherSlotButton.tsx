import { LuCircleCheck, LuCircleX, LuTriangleAlert } from 'react-icons/lu';
import {
	buildTeacherSlotButtonTitle,
	getTeacherSlotButtonClass,
	getTeacherSlotStatusTitle,
	isCurrentAgreementTeacherSlot,
	isTeacherSlotSelected,
} from '@/components/agreements/teacherSlotButtonHelpers';
import type { SlotStatus, SlotWithStatus } from '@/lib/agreementSlots';
import { formatTime } from '@/lib/time/time-format';
import { cn } from '@/lib/utils';

const SLOT_STATUS_ICON: Record<SlotStatus, typeof LuCircleCheck> = {
	free: LuCircleCheck,
	partial: LuTriangleAlert,
	occupied: LuCircleX,
};

const SLOT_STATUS_TITLE: Record<SlotStatus, string> = {
	free: 'Vrij',
	partial: 'Deels bezet',
	occupied: 'Bezet',
};

interface CurrentAgreementSlot {
	day_of_week: number;
	start_time: string;
}

interface TeacherSlotButtonProps {
	slot: SlotWithStatus;
	selectedSlot: SlotWithStatus | null;
	currentAgreementSlot: CurrentAgreementSlot | null;
	onSlotClick: (slot: SlotWithStatus) => void;
}

export function TeacherSlotButton({ slot, selectedSlot, currentAgreementSlot, onSlotClick }: TeacherSlotButtonProps) {
	const isSelected = isTeacherSlotSelected(selectedSlot, slot);
	const isCurrentAgreementSlot = isCurrentAgreementTeacherSlot(currentAgreementSlot, slot);
	const isOccupied = slot.status === 'occupied';
	const StatusIcon = SLOT_STATUS_ICON[slot.status];
	const statusTitle = getTeacherSlotStatusTitle(slot);

	return (
		<button
			key={`${slot.day_of_week}-${slot.start_time}`}
			type="button"
			disabled={isOccupied}
			onClick={() => onSlotClick(slot)}
			className={getTeacherSlotButtonClass({
				isOccupied,
				isSelected,
				isCurrentAgreementSlot,
				status: slot.status,
			})}
			title={buildTeacherSlotButtonTitle(slot, isCurrentAgreementSlot, SLOT_STATUS_TITLE[slot.status])}
		>
			<StatusIcon
				className={cn(
					'h-3.5 w-3.5 shrink-0',
					slot.status === 'free' && 'text-green-600 dark:text-green-400',
					slot.status === 'partial' && 'text-amber-600 dark:text-amber-400',
					slot.status === 'occupied' && 'text-muted-foreground opacity-70',
				)}
				title={statusTitle}
				aria-label={statusTitle}
			/>
			<span className="font-medium tabular-nums">{formatTime(slot.start_time)}</span>
		</button>
	);
}
