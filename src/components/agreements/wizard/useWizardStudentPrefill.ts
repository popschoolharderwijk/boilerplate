import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/users';

export function useWizardStudentPrefill(
	isEditMode: boolean,
	prefillStudentUserId: string | null,
	prefillLessonTypeId: string | null,
	setForm: React.Dispatch<
		React.SetStateAction<import('@/components/agreements/wizard/wizardFormTypes').WizardFormState>
	>,
) {
	useEffect(() => {
		if (isEditMode || !prefillStudentUserId) return;
		void supabase
			.from('profiles')
			.select('user_id, first_name, last_name, email, avatar_url, phone_number')
			.eq('user_id', prefillStudentUserId)
			.maybeSingle()
			.then(({ data: profile }) => {
				setForm((f) => ({
					...f,
					studentUserId: prefillStudentUserId,
					lessonTypeId: prefillLessonTypeId ?? f.lessonTypeId,
					user: profile
						? ({
								user_id: profile.user_id,
								first_name: profile.first_name,
								last_name: profile.last_name,
								email: profile.email,
								avatar_url: profile.avatar_url,
								phone_number: profile.phone_number,
							} satisfies User)
						: f.user,
				}));
			});
	}, [isEditMode, prefillStudentUserId, prefillLessonTypeId, setForm]);
}
