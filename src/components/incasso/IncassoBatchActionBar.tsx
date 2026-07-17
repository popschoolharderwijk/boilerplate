import { Button } from '@/components/ui/button';
import {
	resolveIncassoBatchActionHandler,
	resolveIncassoBatchActionIcon,
} from '@/lib/incasso/incassoBatchActionBarHelpers';
import { buildIncassoBatchActionDescriptors } from '@/lib/incasso/incassoBatchActionDescriptors';
import type { IncassoBatchActionFlags } from '@/lib/incasso/incassoBatchDetailContentHelpers';
import type { IncassoBatch } from '@/lib/incasso/types';

interface IncassoBatchActionBarProps {
	batch: IncassoBatch;
	busy: boolean;
	flags: IncassoBatchActionFlags;
	onBuild: () => void;
	onApprove: () => void;
	onGenerateXml: () => void;
	onClose: () => void;
	onDownloadXml: (path: string) => void;
}

export function IncassoBatchActionBar(props: IncassoBatchActionBarProps) {
	const { batch, busy, flags } = props;
	const actions = buildIncassoBatchActionDescriptors(flags, batch, busy);

	return (
		<div className="flex flex-wrap gap-2">
			{actions.map((action) => {
				const Icon = resolveIncassoBatchActionIcon(action.kind);
				return (
					<Button
						key={action.kind}
						variant={action.variant}
						onClick={resolveIncassoBatchActionHandler(action.kind, props)}
						disabled={action.disabled}
					>
						{Icon ? <Icon className="h-4 w-4 mr-2" /> : null}
						{action.label}
					</Button>
				);
			})}
		</div>
	);
}
