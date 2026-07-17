import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { LessonTypeOption } from '@/components/ui/lesson-type-selector';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfileContactByUserId } from '@/lib/profiles/fetchProfileContact';
import {
	EMPTY_TEACHER_FORM,
	type TeacherFormState,
	teacherFormFromExistingProfile,
	teacherFormFromTeacher,
} from '@/lib/teachers/teacherFormDialogHelpers';
import type { Teacher } from '@/types/teachers';

async function loadActiveLessonTypes(): Promise<LessonTypeOption[]> {
	const { data, error } = await supabase
		.from('lesson_types')
		.select('id, name, icon, color')
		.eq('is_active', true)
		.order('name', { ascending: true });

	if (error) {
		console.error('Error loading lesson types:', error);
		toast.error('Fout bij laden lessoorten');
		return [];
	}
	return data ?? [];
}

async function loadTeacherLessonTypeIds(teacherUserId: string): Promise<string[]> {
	const { data, error } = await supabase
		.from('teacher_lesson_types')
		.select('lesson_type_id')
		.eq('teacher_user_id', teacherUserId);

	if (error) {
		console.error('Error loading teacher lesson types:', error);
		return [];
	}
	return (data ?? []).map((item) => item.lesson_type_id);
}

async function loadExistingTeacherUserIds(): Promise<string[]> {
	const { data } = await supabase.from('teachers').select('user_id');
	return (data ?? []).map((row) => row.user_id);
}

export function useTeacherFormDialogData(
	open: boolean,
	teacher: Teacher | undefined,
	setForm: Dispatch<SetStateAction<TeacherFormState>>,
) {
	const [lessonTypes, setLessonTypes] = useState<LessonTypeOption[]>([]);
	const [loadingLessonTypes, setLoadingLessonTypes] = useState(false);
	const [teacherUserIds, setTeacherUserIds] = useState<string[]>([]);

	useEffect(() => {
		if (!open) return;
		setLoadingLessonTypes(true);
		void loadActiveLessonTypes().then((types) => {
			setLessonTypes(types);
			setLoadingLessonTypes(false);
		});
	}, [open]);

	useEffect(() => {
		if (!open || !teacher) return;
		void loadTeacherLessonTypeIds(teacher.user_id).then((lessonTypeIds) => {
			setForm((prev) => ({ ...prev, lesson_type_ids: lessonTypeIds }));
		});
	}, [open, teacher, setForm]);

	useEffect(() => {
		if (!open || teacher) return;
		void loadExistingTeacherUserIds().then(setTeacherUserIds);
	}, [open, teacher]);

	return { lessonTypes, loadingLessonTypes, teacherUserIds };
}

export function createInitialTeacherFormState(open: boolean, teacher: Teacher | undefined): TeacherFormState {
	if (!open) return EMPTY_TEACHER_FORM;
	return teacher ? teacherFormFromTeacher(teacher) : EMPTY_TEACHER_FORM;
}

export async function loadTeacherFormUserData(userId: string): Promise<TeacherFormState> {
	const profile = await fetchProfileContactByUserId(userId);
	if (!profile) return EMPTY_TEACHER_FORM;
	return teacherFormFromExistingProfile(profile.email);
}
