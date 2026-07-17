import type { IncassoBatchActionKind } from '@/lib/incasso/incassoBatchActionBarHelpers';
import {
	resolveIncassoBatchActionKinds,
	shouldDisableIncassoApproveAction,
} from '@/lib/incasso/incassoBatchActionBarHelpers';
import type { IncassoBatchActionFlags } from '@/lib/incasso/incassoBatchDetailContentHelpers';
import type { IncassoBatch } from '@/lib/incasso/types';

export type IncassoBatchActionDescriptor = {
	kind: IncassoBatchActionKind;
	label: string;
	variant: 'default' | 'outline';
	disabled: boolean;
};

type DescriptorContext = {
	batch: IncassoBatch;
	busy: boolean;
};

const INCASSO_BATCH_ACTION_DESCRIPTOR_BUILDERS: Record<
	IncassoBatchActionKind,
	(ctx: DescriptorContext) => Omit<IncassoBatchActionDescriptor, 'kind'>
> = {
	build: ({ busy }) => ({ label: 'Vul concept', variant: 'default', disabled: busy }),
	approve: ({ batch, busy }) => ({
		label: 'Goedkeuren',
		variant: 'outline',
		disabled: shouldDisableIncassoApproveAction(batch.item_count, busy),
	}),
	'generate-xml': ({ busy }) => ({ label: 'Genereer XML & aanbieden', variant: 'default', disabled: busy }),
	'download-xml': () => ({ label: 'Download XML', variant: 'outline', disabled: false }),
	close: () => ({ label: 'Markeer als afgerond', variant: 'outline', disabled: false }),
};

export function buildIncassoBatchActionDescriptor(
	kind: IncassoBatchActionKind,
	ctx: DescriptorContext,
): IncassoBatchActionDescriptor {
	return { kind, ...INCASSO_BATCH_ACTION_DESCRIPTOR_BUILDERS[kind](ctx) };
}

export function buildIncassoBatchActionDescriptors(
	flags: IncassoBatchActionFlags,
	batch: IncassoBatch,
	busy: boolean,
): IncassoBatchActionDescriptor[] {
	const kinds = resolveIncassoBatchActionKinds(flags);
	const ctx = { batch, busy };
	return kinds.map((kind) => buildIncassoBatchActionDescriptor(kind, ctx));
}
