import type { IconType } from 'react-icons';
import { LuCalendar, LuClipboardCheck, LuClock, LuUser } from 'react-icons/lu';
import { WizardStepIndicatorStep } from '@/components/agreements/WizardStepIndicatorStep';
import type { WizardStepDef } from '@/components/agreements/wizardStepIndicatorHelpers';

export type { WizardStepDef };

export enum WizardStep {
	User = 'user',
	Period = 'period',
	TeacherSlot = 'teacher_slot',
	Confirm = 'confirm',
}

export const STEP_ORDER: WizardStep[] = [
	WizardStep.User,
	WizardStep.Period,
	WizardStep.TeacherSlot,
	WizardStep.Confirm,
];

const STEP_CONFIG: Record<WizardStep, { label: string; icon: IconType }> = {
	[WizardStep.User]: { label: 'Leerling', icon: LuUser },
	[WizardStep.Period]: { label: 'Periode', icon: LuCalendar },
	[WizardStep.TeacherSlot]: { label: 'Docent & tijdslot', icon: LuClock },
	[WizardStep.Confirm]: { label: 'Overzicht', icon: LuClipboardCheck },
};

interface WizardStepIndicatorProps<TStep extends string> {
	step: TStep;
	stepIndex: number;
	highestReachedStepIndex: number;
	onStepChange: (step: TStep) => void;
	/** Optional custom step definitions; when omitted falls back to the agreement-wizard steps. */
	steps?: WizardStepDef<TStep>[];
}

export function WizardStepIndicator<TStep extends string = WizardStep>({
	step,
	stepIndex,
	highestReachedStepIndex,
	onStepChange,
	steps,
}: WizardStepIndicatorProps<TStep>) {
	const stepDefs: WizardStepDef<TStep>[] =
		steps ??
		(STEP_ORDER.map((key) => ({
			key,
			label: STEP_CONFIG[key].label,
			icon: STEP_CONFIG[key].icon,
		})) as unknown as WizardStepDef<TStep>[]);

	return (
		<div className="flex items-center px-2 pt-2">
			{stepDefs.map((stepDef, idx) => (
				<WizardStepIndicatorStep
					key={stepDef.key}
					stepDef={stepDef}
					idx={idx}
					stepCount={stepDefs.length}
					step={step}
					stepIndex={stepIndex}
					highestReachedStepIndex={highestReachedStepIndex}
					onStepChange={onStepChange}
				/>
			))}
		</div>
	);
}
