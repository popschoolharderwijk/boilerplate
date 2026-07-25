import { AgendaEventCancellationBanner } from '@/components/agenda/AgendaEventCancellationBanner';
import {
	resolveAgendaCancellationBannerProps,
	resolveAgendaDeviationBannerProps,
} from '@/components/agenda/agendaEventFormDialogContentHelpers';
import { DeviationInfoBanner } from '@/components/agenda/DeviationInfoBanner';
import type { AgendaEventFormDialogContext } from '@/components/agenda/useAgendaEventFormDialog';

interface AgendaEventFormDialogBannersProps {
	ctx: Pick<
		AgendaEventFormDialogContext,
		| 'deviationInfo'
		| 'cancellationType'
		| 'needsReschedule'
		| 'onMarkRescheduled'
		| 'isCancelling'
		| 'permissions'
		| 'actions'
		| 'saving'
	>;
}

export function AgendaEventFormDialogBanners({ ctx }: AgendaEventFormDialogBannersProps) {
	const deviationBanner = resolveAgendaDeviationBannerProps(
		ctx.permissions.canRevert,
		ctx.deviationInfo?.hasTimeOrDateChange,
		ctx.deviationInfo,
	);
	const cancellationBanner = resolveAgendaCancellationBannerProps(
		ctx.permissions.isCancelledEvent,
		ctx.cancellationType,
	);

	return (
		<>
			{deviationBanner && (
				<DeviationInfoBanner
					deviationInfo={deviationBanner.deviationInfo}
					onRevert={ctx.actions.handleRevert}
					disabled={ctx.saving}
					reverting={ctx.actions.reverting}
				/>
			)}
			{cancellationBanner && (
				<AgendaEventCancellationBanner
					cancellationType={cancellationBanner.cancellationType}
					needsReschedule={ctx.needsReschedule}
					onMarkRescheduled={ctx.onMarkRescheduled}
					saving={ctx.saving}
					isCancelling={ctx.isCancelling}
				/>
			)}
		</>
	);
}
