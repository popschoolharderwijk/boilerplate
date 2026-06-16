import type { SlotWithStatus } from '@/lib/agreementSlots';
import type { WizardInitialAgreement, WizardLessonTypeInfo, WizardTeacherInfo } from '@/types/lesson-agreements';
import type { UserOptional } from '@/types/users';
import { ConfirmStepDiffView } from './ConfirmStepDiffView';
import { ConfirmStepSingleView } from './ConfirmStepSingleView';

interface ConfirmStepContentProps {
	isEditMode: boolean;
	hasChanges: boolean;
	initialAgreement: WizardInitialAgreement | null;
	loadedPeriod: { start_date: string; end_date: string | null } | null;
	selectedUser: UserOptional | null;
	selectedLessonType: WizardLessonTypeInfo | undefined;
	startDate: string;
	endDate: string;
	selectedTeacherUserId: string | null;
	selectedTeacher: WizardTeacherInfo | undefined;
	effectiveSlot: SlotWithStatus | null;
}

export function ConfirmStepContent({
	isEditMode,
	hasChanges,
	initialAgreement,
	loadedPeriod,
	selectedUser,
	selectedLessonType,
	startDate,
	endDate,
	selectedTeacherUserId,
	selectedTeacher,
	effectiveSlot,
}: ConfirmStepContentProps) {
	if (isEditMode && initialAgreement && hasChanges) {
		return (
			<ConfirmStepDiffView
				initialAgreement={initialAgreement}
				loadedPeriod={loadedPeriod}
				selectedUser={selectedUser}
				selectedLessonType={selectedLessonType}
				startDate={startDate}
				endDate={endDate}
				selectedTeacherUserId={selectedTeacherUserId}
				selectedTeacher={selectedTeacher}
				effectiveSlot={effectiveSlot}
			/>
		);
	}

	return (
		<ConfirmStepSingleView
			selectedUser={selectedUser}
			selectedLessonType={selectedLessonType}
			startDate={startDate}
			endDate={endDate}
			selectedTeacher={selectedTeacher}
			effectiveSlot={effectiveSlot}
		/>
	);
}
