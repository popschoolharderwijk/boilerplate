import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	useEligibleStudents,
	useLessonGroupEditLoad,
	useLessonGroupTeacherSlots,
	useLessonGroupTeachers,
	useLessonGroupTypes,
	usePendingSignupRequests,
} from '@/components/lesson-groups/wizard/lessonGroupDataHooks';
import {
	handleLessonGroupSlotClick,
	runLessonGroupWizardSave,
} from '@/components/lesson-groups/wizard/lessonGroupWizardActions';
import { lessonGroupDefaultEndDate } from '@/components/lesson-groups/wizard/lessonGroupWizardDateDefaults';
import type { LGStep } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';
import {
	useLessonGroupForm,
	useLessonGroupWizardSteps,
} from '@/components/lesson-groups/wizard/useLessonGroupFormAndSteps';
import { useAuth } from '@/hooks/useAuth';

function useLessonGroupWizardData(
	form: ReturnType<typeof useLessonGroupForm>['form'],
	step: LGStep,
	isEditMode: boolean,
	groupId: string | undefined,
) {
	const lessonTypes = useLessonGroupTypes();
	const teachers = useLessonGroupTeachers(form.lessonTypeId);
	const eligibleStudentIds = useEligibleStudents(form.lessonTypeId);
	const pendingRequests = usePendingSignupRequests(form.lessonTypeId);
	const { slots, loadingSlots } = useLessonGroupTeacherSlots({
		step,
		teacherUserId: form.teacherUserId,
		startDate: form.startDate,
		endDate: form.endDate,
		durationMinutes: form.durationMinutes,
		frequency: form.frequency,
		isEditMode,
		groupId,
	});

	return { lessonTypes, teachers, eligibleStudentIds, pendingRequests, slots, loadingSlots };
}

export function useLessonGroupWizard() {
	const { id } = useParams<{ id: string }>();
	const isEditMode = id !== undefined && id !== 'new';
	const navigate = useNavigate();
	const { isAdmin, isSiteAdmin, isPrivileged, isLoading: authLoading } = useAuth();
	const canEdit = isAdmin || isSiteAdmin || isPrivileged;

	const { loading: loadingGroup, initial } = useLessonGroupEditLoad(id, isEditMode, lessonGroupDefaultEndDate());
	const { form, setForm, formUpdaters } = useLessonGroupForm(initial);
	const steps = useLessonGroupWizardSteps(form, initial != null);
	const data = useLessonGroupWizardData(form, steps.step, isEditMode, id);

	const [saving, setSaving] = useState(false);
	const [partialOpen, setPartialOpen] = useState(false);

	const selectedLessonType = data.lessonTypes.find((lt) => lt.id === form.lessonTypeId);
	const selectedTeacher = data.teachers.find((t) => t.userId === form.teacherUserId);

	const clearSlot = useCallback(() => setForm((f) => ({ ...f, slot: null })), [setForm]);
	const handleSlotClick = useCallback(
		(slot: Parameters<typeof handleLessonGroupSlotClick>[0]) =>
			handleLessonGroupSlotClick(slot, setForm, setPartialOpen),
		[setForm],
	);
	const handleSave = useCallback(
		() => runLessonGroupWizardSave({ form, isEditMode, groupId: id, navigate, setSaving }),
		[form, isEditMode, id, navigate],
	);

	return {
		authLoading,
		canEdit,
		isEditMode,
		loading: loadingGroup,
		saving,
		form,
		formUpdaters,
		...data,
		selectedLessonType,
		selectedTeacher,
		partialOpen,
		setPartialOpen,
		clearSlot,
		handleSlotClick,
		handleSave,
		navigate,
		...steps,
	};
}

export type LessonGroupWizardState = ReturnType<typeof useLessonGroupWizard>;
