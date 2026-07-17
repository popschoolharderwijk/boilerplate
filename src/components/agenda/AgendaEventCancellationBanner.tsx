import { LuCalendarCheck } from 'react-icons/lu';
import {
	getCancellationBannerClassName,
	getCancellationBannerMessage,
	shouldShowCancellationRescheduleButton,
} from '@/components/agenda/agendaEventCancellationBannerHelpers';
import { Button } from '@/components/ui/button';
import type { CancellationType } from '@/types/agenda-events';

interface AgendaEventCancellationBannerProps {
	cancellationType: CancellationType;
	needsReschedule?: boolean;
	onMarkRescheduled?: () => void;
	saving: boolean;
	isCancelling: boolean;
}

export function AgendaEventCancellationBanner({
	cancellationType,
	needsReschedule,
	onMarkRescheduled,
	saving,
	isCancelling,
}: AgendaEventCancellationBannerProps) {
	const showRescheduleButton = shouldShowCancellationRescheduleButton(
		cancellationType,
		needsReschedule,
		onMarkRescheduled,
	);

	return (
		<div
			className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${getCancellationBannerClassName(cancellationType)}`}
		>
			<span>{getCancellationBannerMessage(cancellationType, needsReschedule)}</span>
			{showRescheduleButton && onMarkRescheduled && (
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={onMarkRescheduled}
					disabled={saving || isCancelling}
					className="ml-2"
				>
					<LuCalendarCheck className="h-3 w-3 mr-1" />
					Ingehaald
				</Button>
			)}
		</div>
	);
}
