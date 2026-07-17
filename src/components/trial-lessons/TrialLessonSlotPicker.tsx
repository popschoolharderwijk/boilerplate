import { LuUser } from 'react-icons/lu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { FreeSlotForTeacher } from '@/lib/agreementSlots';
import {
	formatTrialLessonDateHeader,
	getTeacherDisplayName,
	getTeacherInitials,
	type TeacherDisplayInfo,
} from '@/lib/trial-lessons/scheduleTrialLessonHelpers';
import { getTrialLessonSlotKey, isTrialLessonSlotSelected } from '@/lib/trial-lessons/scheduleTrialLessonSlotHelpers';
import { resolveTrialLessonSlotRowClassName } from '@/lib/trial-lessons/trialLessonSlotRowHelpers';

interface TrialLessonSlotPickerProps {
	slotsGroupedByDate: Map<string, FreeSlotForTeacher[]>;
	teachers: Map<string, TeacherDisplayInfo & { userId: string }>;
	selected: FreeSlotForTeacher | null;
	onSelect: (slot: FreeSlotForTeacher) => void;
}

function TrialLessonSlotRow({
	slot,
	teacher,
	isSelected,
	onSelect,
}: {
	slot: FreeSlotForTeacher;
	teacher: (TeacherDisplayInfo & { userId: string }) | undefined;
	isSelected: boolean;
	onSelect: (slot: FreeSlotForTeacher) => void;
}) {
	const displayName = getTeacherDisplayName(teacher);
	const initials = getTeacherInitials(teacher);

	return (
		<li>
			<button
				type="button"
				onClick={() => onSelect(slot)}
				className={resolveTrialLessonSlotRowClassName(isSelected)}
			>
				<span className="w-24 font-mono tabular-nums">
					{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
				</span>
				<Avatar className="h-6 w-6">
					{teacher?.avatarUrl ? <AvatarImage src={teacher.avatarUrl} alt={displayName} /> : null}
					<AvatarFallback className="text-[10px]">
						{teacher ? initials : <LuUser className="h-3 w-3" />}
					</AvatarFallback>
				</Avatar>
				<span className="truncate">{displayName}</span>
			</button>
		</li>
	);
}

export function TrialLessonSlotPicker({
	slotsGroupedByDate,
	teachers,
	selected,
	onSelect,
}: TrialLessonSlotPickerProps) {
	return (
		<div className="divide-y">
			{Array.from(slotsGroupedByDate.entries()).map(([date, slots]) => (
				<div key={date}>
					<div className="sticky top-0 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
						{formatTrialLessonDateHeader(date)}
					</div>
					<ul className="divide-y">
						{slots.map((slot) => (
							<TrialLessonSlotRow
								key={getTrialLessonSlotKey(slot)}
								slot={slot}
								teacher={teachers.get(slot.teacher_user_id)}
								isSelected={isTrialLessonSlotSelected(selected, slot)}
								onSelect={onSelect}
							/>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
