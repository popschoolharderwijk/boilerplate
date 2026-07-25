import type { ReactNode } from 'react';

export interface ConfirmStepRowDisplayInput {
	alwaysSame?: boolean;
	changed?: boolean;
	hideIcon?: boolean;
	oldValue?: ReactNode;
	newValue?: ReactNode;
	children?: ReactNode;
}

export interface ConfirmStepRowDisplay {
	value: ReactNode;
	isMuted: boolean;
	showChangedIcon: boolean;
}

export function resolveConfirmStepRowDisplay(input: ConfirmStepRowDisplayInput): ConfirmStepRowDisplay {
	const value = input.children ?? input.newValue ?? input.oldValue;
	const isMuted = input.changed === false || input.alwaysSame === true;
	const showChangedIcon = input.changed === true && input.hideIcon !== true;

	return { value, isMuted, showChangedIcon };
}
