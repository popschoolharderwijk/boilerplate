import { UserDisplay } from '@/components/ui/user-display';
import type { SlotWithStatus } from '@/lib/agreementSlots';
import type { WizardLessonTypeInfo, WizardTeacherInfo } from '@/types/lesson-agreements';
import type { UserOptional } from '@/types/users';
import { ConfirmStepRow } from './ConfirmStepRow';
import {
	ConfirmPeriodDisplayRow,
	ConfirmSelectedLessonTypeRows,
	ConfirmSlotDisplayRow,
	ConfirmTeacherDisplayRow,
} from './confirmStepSummaryRows';

interface ConfirmStepSingleViewProps {
	selectedUser: UserOptional | null;
	selectedLessonType: WizardLessonTypeInfo | undefined;
	startDate: string;
	endDate: string;
	selectedTeacher: WizardTeacherInfo | undefined;
	effectiveSlot: SlotWithStatus | null;
}

export function ConfirmStepSingleView({
	selectedUser,
	selectedLessonType,
	startDate,
	endDate,
	selectedTeacher,
	effectiveSlot,
}: ConfirmStepSingleViewProps) {
	return (
		<div className="space-y-4 rounded-lg border p-4">
			<ConfirmStepRow label="Leerling">
				{selectedUser ? (
					<UserDisplay
						profile={{
							first_name: selectedUser.first_name,
							last_name: selectedUser.last_name,
							email: selectedUser.email,
							avatar_url: selectedUser.avatar_url,
						}}
						href={selectedUser.user_id ? `/students/${selectedUser.user_id}` : undefined}
						showEmail
					/>
				) : (
					<p className="font-medium">-</p>
				)}
			</ConfirmStepRow>
			<ConfirmSelectedLessonTypeRows lessonType={selectedLessonType} />
			<ConfirmPeriodDisplayRow startDate={startDate} endDate={endDate} />
			<ConfirmTeacherDisplayRow
				teacher={selectedTeacher}
				href={selectedTeacher?.userId ? `/teachers/${selectedTeacher.userId}` : undefined}
			/>
			<ConfirmSlotDisplayRow slot={effectiveSlot} />
		</div>
	);
}
