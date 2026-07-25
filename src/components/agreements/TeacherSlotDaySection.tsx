import { TeacherSlotButton } from '@/components/agreements/TeacherSlotButton';
import type { SlotWithStatus } from '@/lib/agreementSlots';
import { DAY_NAMES } from '@/lib/date/day-index';

interface CurrentAgreementSlot {
	day_of_week: number;
	start_time: string;
}

interface TeacherSlotDaySectionProps {
	dayOfWeek: number;
	daySlots: SlotWithStatus[];
	selectedSlot: SlotWithStatus | null;
	currentAgreementSlot: CurrentAgreementSlot | null;
	onSlotClick: (slot: SlotWithStatus) => void;
}

export function TeacherSlotDaySection({
	dayOfWeek,
	daySlots,
	selectedSlot,
	currentAgreementSlot,
	onSlotClick,
}: TeacherSlotDaySectionProps) {
	return (
		<div className="space-y-1.5">
			<div className="text-xs font-medium text-muted-foreground sticky top-0 bg-background py-0.5">
				{DAY_NAMES[dayOfWeek]}
			</div>
			<div className="flex flex-wrap gap-1.5">
				{daySlots.map((slot) => (
					<TeacherSlotButton
						key={`${slot.day_of_week}-${slot.start_time}`}
						slot={slot}
						selectedSlot={selectedSlot}
						currentAgreementSlot={currentAgreementSlot}
						onSlotClick={onSlotClick}
					/>
				))}
			</div>
		</div>
	);
}
