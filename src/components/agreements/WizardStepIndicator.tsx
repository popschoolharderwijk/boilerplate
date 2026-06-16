import type { IconType } from 'react-icons';
import { LuCalendar, LuCheck, LuClipboardCheck, LuClock, LuUser } from 'react-icons/lu';
import { cn } from '@/lib/utils';

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

export interface WizardStepDef<TStep extends string> {
	key: TStep;
	label: string;
	icon: IconType;
}

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
		(STEP_ORDER.map((k) => ({
			key: k,
			label: STEP_CONFIG[k].label,
			icon: STEP_CONFIG[k].icon,
		})) as unknown as WizardStepDef<TStep>[]);

	return (
		<div className="flex items-center px-2 pt-2">
			{stepDefs.map((stepDef, idx) => {
				const Icon = stepDef.icon;
				const isActive = step === stepDef.key;
				const isCompleted = idx < stepIndex;
				const wasReached = idx <= highestReachedStepIndex;
				const canNavigate = wasReached || isActive;
				return (
					<div key={stepDef.key} className="flex items-center">
						<button
							type="button"
							onClick={() => canNavigate && onStepChange(stepDef.key)}
							disabled={!canNavigate}
							className={cn(
								'flex flex-col items-center transition-opacity',
								canNavigate && 'cursor-pointer hover:opacity-80',
								!canNavigate && 'cursor-not-allowed opacity-60',
							)}
						>
							<div
								className={cn(
									'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
									isActive && 'border-primary bg-primary text-primary-foreground',
									isCompleted && 'border-primary bg-transparent text-primary',
									!isActive &&
										!isCompleted &&
										wasReached &&
										'border-primary/50 bg-transparent text-primary/70',
									!isActive &&
										!isCompleted &&
										!wasReached &&
										'border-muted-foreground/30 text-muted-foreground',
								)}
							>
								{isCompleted ? <LuCheck className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
							</div>
							<span
								className={cn(
									'mt-2 text-xs font-medium',
									isActive && 'text-primary',
									!isActive && wasReached && 'text-primary/70',
									!isActive && !wasReached && 'text-muted-foreground',
								)}
							>
								{stepDef.label}
							</span>
						</button>
						{idx < stepDefs.length - 1 && (
							<div
								className={cn(
									'h-0.5 w-16 mx-4',
									isCompleted
										? 'bg-primary'
										: wasReached
											? 'bg-primary/50'
											: 'bg-muted-foreground/30',
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
