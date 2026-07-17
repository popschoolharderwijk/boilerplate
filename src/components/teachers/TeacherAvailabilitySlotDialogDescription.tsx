import type { AvailabilityDialogDescription } from '@/lib/teachers/teacherAvailabilitySectionHelpers';
import { getAvailabilityDialogDescriptionText } from '@/lib/teachers/teacherAvailabilitySectionHelpers';
import { formatTime } from '@/lib/time/time-format';

interface TeacherAvailabilitySlotDialogDescriptionProps {
	description: AvailabilityDialogDescription | null;
}

export function TeacherAvailabilitySlotDialogDescription({
	description,
}: TeacherAvailabilitySlotDialogDescriptionProps) {
	const text = getAvailabilityDialogDescriptionText(description);
	if (!text) return null;

	return (
		<>
			{text.prefix} <strong>{text.dayName}</strong>
			{text.startTime ? (
				<>
					{' '}
					vanaf <strong>{formatTime(text.startTime)}</strong>
				</>
			) : null}
		</>
	);
}
