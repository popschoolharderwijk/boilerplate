import { TeacherLessonTypesSectionBody } from '@/components/teachers/TeacherLessonTypesSectionParts';
import { SectionSkeleton } from '@/components/ui/page-skeleton';
import { useTeacherLessonTypes } from '@/hooks/useTeacherLessonTypes';

interface TeacherLessonTypesSectionProps {
	teacherUserId: string;
	canEdit: boolean;
}

export function TeacherLessonTypesSection({ teacherUserId, canEdit }: TeacherLessonTypesSectionProps) {
	const {
		lessonTypes,
		loading,
		saving,
		addPopoverOpen,
		setAddPopoverOpen,
		availableLessonTypes,
		handleAddLessonType,
		handleRemoveLessonType,
	} = useTeacherLessonTypes(teacherUserId, canEdit);

	if (loading) {
		return <SectionSkeleton />;
	}

	return (
		<TeacherLessonTypesSectionBody
			lessonTypes={lessonTypes}
			canEdit={canEdit}
			saving={saving}
			addPopoverOpen={addPopoverOpen}
			availableLessonTypes={availableLessonTypes}
			onAddPopoverOpenChange={setAddPopoverOpen}
			onAddLessonType={handleAddLessonType}
			onRemoveLessonType={handleRemoveLessonType}
		/>
	);
}
