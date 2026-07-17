import { type FormEvent, useCallback } from 'react';
import type { OptionSnapshot } from '@/components/lesson-type-options/LessonTypeOptionSelect';
import { supabase } from '@/integrations/supabase/client';
import { getInvokeErrorMessage } from '@/lib/auth/invokeError';
import {
	applyPublicSignupSubmitOutcome,
	executePublicSignupSubmit,
	type SignupFormFields,
	type SignupSepaFields,
	validateSepaFields,
} from '@/lib/signup/publicSignupHelpers';
import type { LessonTypeOptionRow } from '@/types/lesson-agreements';
import type { LessonType } from './types';

interface UsePublicSignupSubmitParams {
	selectedType: LessonType | null;
	selectedGroupId: string | 'waitlist' | null;
	selectedOption: OptionSnapshot | null;
	lessonTypeOptions: LessonTypeOptionRow[];
	form: SignupFormFields;
	sepa: SignupSepaFields;
	setSubmitting: (submitting: boolean) => void;
	setError: (error: string | null) => void;
	onSuccess: () => void;
}

export function usePublicSignupSubmit({
	selectedType,
	selectedGroupId,
	selectedOption,
	lessonTypeOptions,
	form,
	sepa,
	setSubmitting,
	setError,
	onSuccess,
}: UsePublicSignupSubmitParams) {
	return useCallback(
		async (event: FormEvent) => {
			event.preventDefault();
			if (!selectedType) return;

			const sepaError = validateSepaFields(sepa);
			if (sepaError) {
				setError(sepaError);
				return;
			}

			setSubmitting(true);
			setError(null);

			const outcome = await executePublicSignupSubmit({
				selectedType,
				selectedGroupId,
				selectedOption,
				lessonTypeOptions,
				form,
				sepa,
				invoke: (body) => supabase.functions.invoke('submit-signup-request', { body }),
				getInvokeErrorMessage,
			});

			setSubmitting(false);
			applyPublicSignupSubmitOutcome(outcome, setError, onSuccess);
		},
		[
			selectedType,
			selectedGroupId,
			selectedOption,
			lessonTypeOptions,
			form,
			sepa,
			setSubmitting,
			setError,
			onSuccess,
		],
	);
}
