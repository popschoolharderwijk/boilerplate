import type { FormEvent } from 'react';
import { LuMusic } from 'react-icons/lu';
import type { OptionSnapshot } from '@/components/lesson-type-options/LessonTypeOptionSelect';
import type { SignupFormFields, SignupSepaFields } from '@/lib/signup/publicSignupHelpers';
import type { LessonTypeOptionRow } from '@/types/lesson-agreements';
import { PublicSignupStepSwitch } from './PublicSignupStepSwitch';
import type { GroupOption, LessonType, SignupStep } from './types';

interface PublicSignupLayoutProps {
	step: SignupStep;
	selectedType: LessonType | null;
	lessonTypes: LessonType[];
	groups: GroupOption[];
	selectedGroupId: string | 'waitlist' | null;
	lessonTypeOptions: LessonTypeOptionRow[];
	selectedOption: OptionSnapshot | null;
	form: SignupFormFields;
	sepa: SignupSepaFields;
	error: string | null;
	submitting: boolean;
	onSelectType: (lessonType: LessonType) => void;
	onSelectGroupId: (groupId: string | 'waitlist') => void;
	onSelectOption: (option: OptionSnapshot | null) => void;
	onFormChange: (form: SignupFormFields) => void;
	onSepaChange: (sepa: SignupSepaFields) => void;
	onStepChange: (step: SignupStep) => void;
	onSubmit: (event: FormEvent) => void;
}

export function PublicSignupLayout(props: PublicSignupLayoutProps) {
	return (
		<div className="min-h-screen bg-background py-8 px-4">
			<div className="max-w-2xl mx-auto">
				<header className="text-center mb-8">
					<div className="inline-flex items-center gap-2 mb-3">
						<div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
							<LuMusic className="h-5 w-5" />
						</div>
						<span className="text-xl font-bold">
							<span className="text-primary uppercase">POP</span>
							<span className="lowercase">school Harderwijk</span>
						</span>
					</div>
					<h1 className="text-3xl font-bold">Aanmelden voor lessen</h1>
					<p className="text-muted-foreground mt-2">Stap {props.step} van 3</p>
					<p className="sr-only">
						{props.selectedType?.is_group_lesson ? 'Groepsles aanmelding' : 'Individuele les aanmelding'}
					</p>
				</header>

				<div className="rounded-lg border bg-card p-6">
					<PublicSignupStepSwitch {...props} />
				</div>
			</div>
		</div>
	);
}
