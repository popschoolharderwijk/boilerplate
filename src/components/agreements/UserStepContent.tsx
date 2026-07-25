import { UserStepCreateContent, UserStepEditContent } from '@/components/agreements/UserStepSections';
import type { OptionSnapshot } from '@/components/lesson-type-options/LessonTypeOptionSelect';
import type { LessonTypeOption } from '@/components/ui/lesson-type-select';
import type { LessonTypeOptionSnapshot, WizardLessonTypeInfo } from '@/types/lesson-agreements';
import type { User } from '@/types/users';

interface UserStepContentProps {
	isEditMode: boolean;
	selectedStudentUserId: string | null;
	selectedUser: User | null;
	selectedLessonTypeId: string | null;
	selectedLessonType: WizardLessonTypeInfo | undefined;
	lessonTypes: LessonTypeOption[];
	lessonTypeOptions: LessonTypeOptionSnapshot[];
	selectedOptionSnapshot: OptionSnapshot | null;
	onStudentUserIdChange: (userId: string | null) => void;
	onUserChange: (user: User | null) => void;
	onLessonTypeChange: (lessonTypeId: string | null) => void;
	onOptionSnapshotChange: (snap: OptionSnapshot | null) => void;
	isDuoLesson?: boolean;
	partnerStudentUserId?: string | null;
	partnerUser?: User | null;
	onPartnerStudentUserIdChange?: (userId: string | null) => void;
	onPartnerUserChange?: (user: User | null) => void;
}

export function UserStepContent({
	isEditMode,
	selectedStudentUserId,
	selectedUser,
	selectedLessonTypeId,
	selectedLessonType,
	lessonTypes,
	lessonTypeOptions,
	selectedOptionSnapshot,
	onStudentUserIdChange,
	onUserChange,
	onLessonTypeChange,
	onOptionSnapshotChange,
	isDuoLesson = false,
	partnerStudentUserId = null,
	partnerUser = null,
	onPartnerStudentUserIdChange,
	onPartnerUserChange,
}: UserStepContentProps) {
	if (isEditMode) {
		return <UserStepEditContent selectedUser={selectedUser} selectedLessonType={selectedLessonType} />;
	}

	return (
		<UserStepCreateContent
			selectedStudentUserId={selectedStudentUserId}
			selectedLessonTypeId={selectedLessonTypeId}
			lessonTypes={lessonTypes}
			lessonTypeOptions={lessonTypeOptions}
			selectedOptionSnapshot={selectedOptionSnapshot}
			onStudentUserIdChange={onStudentUserIdChange}
			onUserChange={onUserChange}
			onLessonTypeChange={onLessonTypeChange}
			onOptionSnapshotChange={onOptionSnapshotChange}
			isDuoLesson={isDuoLesson}
			partnerStudentUserId={partnerStudentUserId}
			partnerUser={partnerUser}
			onPartnerStudentUserIdChange={onPartnerStudentUserIdChange}
			onPartnerUserChange={onPartnerUserChange}
		/>
	);
}
