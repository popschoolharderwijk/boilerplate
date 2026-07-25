import { supabase } from '@/integrations/supabase/client';
import { buildTeacherOptsFromActives } from '@/lib/teachers/teacherOptHelpers';
import type { WizardTeacherInfo } from '@/types/lesson-agreements';

export async function loadWizardTeachers(lessonTypeId: string): Promise<WizardTeacherInfo[]> {
	const { data: teacherLessonTypes } = await supabase
		.from('teacher_lesson_types')
		.select('teacher_user_id')
		.eq('lesson_type_id', lessonTypeId);

	if (!teacherLessonTypes?.length) return [];

	const teacherUserIds = teacherLessonTypes.map((row) => row.teacher_user_id);
	const { data: activeTeachers } = await supabase
		.from('teachers')
		.select('user_id')
		.in('user_id', teacherUserIds)
		.eq('is_active', true);

	if (!activeTeachers?.length) return [];

	const userIds = activeTeachers.map((teacher) => teacher.user_id);
	const { data: profiles } = await supabase
		.from('profiles')
		.select('user_id, first_name, last_name, email, avatar_url')
		.in('user_id', userIds);

	return buildTeacherOptsFromActives(activeTeachers, profiles ?? []) as WizardTeacherInfo[];
}
