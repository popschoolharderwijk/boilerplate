import { LuPencil } from 'react-icons/lu';
import type { AvailabilityBlock } from '@/lib/teachers/teacherAvailabilitySectionHelpers';
import { shouldShowAvailabilityBlockTimes } from '@/lib/teachers/teacherAvailabilitySectionHelpers';
import { formatTime } from '@/lib/time/time-format';

interface TeacherAvailabilityBlockButtonProps {
	block: AvailabilityBlock;
	dayName: string;
	canEdit: boolean;
	onClick: (block: AvailabilityBlock) => void;
}

export function TeacherAvailabilityBlockButton({
	block,
	dayName,
	canEdit,
	onClick,
}: TeacherAvailabilityBlockButtonProps) {
	const startLabel = formatTime(block.startTime);
	const endLabel = formatTime(block.endTime);
	const showTimes = shouldShowAvailabilityBlockTimes(block.startTime, block.endTime);

	return (
		<button
			type="button"
			className="availability-block absolute left-0.5 right-0.5 bg-emerald-500/80 hover:bg-emerald-500 rounded-md shadow-sm transition-all cursor-pointer group border border-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-white/50 z-10"
			style={{
				top: `${block.topPercent}%`,
				height: `${block.heightPercent}%`,
				minHeight: '10px',
			}}
			onClick={(event) => {
				event.stopPropagation();
				onClick(block);
			}}
			title={`${dayName} ${startLabel} - ${endLabel}`}
		>
			{showTimes && (
				<>
					<div
						className="block-content-single absolute inset-0 flex flex-col items-center justify-center gap-0 p-0.5 overflow-hidden min-w-0"
						title={`${startLabel} – ${endLabel}`}
					>
						<span className="text-[10px] font-medium leading-tight text-white truncate max-w-full">
							{startLabel}
						</span>
						<span className="text-[10px] font-medium leading-tight text-white truncate max-w-full">
							{endLabel}
						</span>
					</div>
					<div
						className="block-content-double absolute inset-0 flex flex-col items-center justify-center gap-0 p-0.5 overflow-hidden text-center min-w-0"
						title={`${startLabel} – ${endLabel}`}
					>
						<span className="text-[12px] font-medium leading-tight text-white truncate max-w-full">
							{startLabel}
						</span>
						<span className="text-[12px] font-medium leading-tight text-white truncate max-w-full">
							{endLabel}
						</span>
					</div>
				</>
			)}

			{canEdit && (
				<div className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
					<span className="block-edit-icon-small">
						<LuPencil className="h-2.5 w-2.5 text-white" />
					</span>
					<span className="block-edit-icon">
						<LuPencil className="h-4 w-4 text-white" />
					</span>
				</div>
			)}
		</button>
	);
}
