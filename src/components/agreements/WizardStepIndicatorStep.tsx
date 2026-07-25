import type { IconType } from 'react-icons';
import { LuCheck } from 'react-icons/lu';
import type { WizardStepDef } from '@/components/agreements/wizardStepIndicatorHelpers';
import {
	getWizardStepCircleClass,
	getWizardStepConnectorClass,
	getWizardStepLabelClass,
	getWizardStepVisualState,
} from '@/components/agreements/wizardStepIndicatorHelpers';
import {
	createWizardStepIndicatorClickHandler,
	getWizardStepIndicatorButtonClass,
	resolveWizardStepIndicatorIconKind,
	shouldShowWizardStepConnector,
} from '@/components/agreements/wizardStepIndicatorStepHelpers';
import { cn } from '@/lib/utils';

interface WizardStepIndicatorStepProps<TStep extends string> {
	stepDef: WizardStepDef<TStep>;
	idx: number;
	stepCount: number;
	step: TStep;
	stepIndex: number;
	highestReachedStepIndex: number;
	onStepChange: (step: TStep) => void;
}

export function WizardStepIndicatorStep<TStep extends string>({
	stepDef,
	idx,
	stepCount,
	step,
	stepIndex,
	highestReachedStepIndex,
	onStepChange,
}: WizardStepIndicatorStepProps<TStep>) {
	const Icon = stepDef.icon as IconType;
	const isActive = step === stepDef.key;
	const { isCompleted, wasReached, canNavigate } = getWizardStepVisualState(
		idx,
		stepIndex,
		highestReachedStepIndex,
		isActive,
	);
	const iconKind = resolveWizardStepIndicatorIconKind(isCompleted);
	const handleClick = createWizardStepIndicatorClickHandler(canNavigate, onStepChange, stepDef.key);

	return (
		<div className="flex items-center">
			<button
				type="button"
				onClick={handleClick}
				disabled={!canNavigate}
				className={getWizardStepIndicatorButtonClass(canNavigate)}
			>
				<div
					className={cn(
						'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
						getWizardStepCircleClass(isActive, isCompleted, wasReached),
					)}
				>
					{iconKind === 'check' ? <LuCheck className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
				</div>
				<span className={cn('mt-2 text-xs font-medium', getWizardStepLabelClass(isActive, wasReached))}>
					{stepDef.label}
				</span>
			</button>
			{shouldShowWizardStepConnector(idx, stepCount) && (
				<div className={cn('h-0.5 w-16 mx-4', getWizardStepConnectorClass(isCompleted, wasReached))} />
			)}
		</div>
	);
}
