import { LuCalendarPlus, LuCheck, LuX } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type SignupRequestRowBase, statusBadgeVariant } from '@/lib/signup-requests/signupRequestsPageHelpers';
import { getSignupRequestRowActionState } from '@/lib/signup-requests/signupRequestsTableActionHelpers';
import { SignupLessonTypeCellLines } from '@/lib/signup-requests/signupRequestsTableCellParts';
import {
	formatSignupTrialScheduledLine,
	getSignupLessonTypeCellContent,
	getSignupStatusDisplayLabel,
} from '@/lib/signup-requests/signupRequestsTableFormatters';

type SignupRowAction = { kind: 'reject' | 'process'; row: SignupRequestRowBase };

interface SignupActionsCellProps {
	row: SignupRequestRowBase;
	busyId: string | null;
	runAction: (action: SignupRowAction) => void;
	setTrialFor: (row: SignupRequestRowBase) => void;
}

export function SignupRequestActionsCell({ row, busyId, runAction, setTrialFor }: SignupActionsCellProps) {
	const actionState = getSignupRequestRowActionState(row.status, row.id, busyId);
	if (!actionState.showActions) return null;
	return (
		<div className="flex gap-2 justify-end">
			<Button
				size="sm"
				variant="outline"
				onClick={() => runAction({ kind: 'reject', row })}
				disabled={actionState.isBusy}
			>
				<LuX className="h-4 w-4" />
			</Button>
			{actionState.showTrialButton && (
				<Button size="sm" variant="outline" onClick={() => setTrialFor(row)} disabled={actionState.isBusy}>
					<LuCalendarPlus className="h-4 w-4" /> Proefles
				</Button>
			)}
			<Button size="sm" onClick={() => runAction({ kind: 'process', row })} disabled={actionState.isBusy}>
				<LuCheck className="h-4 w-4" /> Verwerken
			</Button>
		</div>
	);
}

interface SignupLessonTypeCellProps {
	row: SignupRequestRowBase;
}

export function SignupRequestLessonTypeCell({ row }: SignupLessonTypeCellProps) {
	const content = getSignupLessonTypeCellContent(row);
	return <SignupLessonTypeCellLines content={content} />;
}

interface SignupStatusCellProps {
	row: SignupRequestRowBase;
	formatDate: (value: string) => string;
}

export function SignupRequestStatusCell({ row, formatDate }: SignupStatusCellProps) {
	const trialLine = formatSignupTrialScheduledLine(row, formatDate);
	return (
		<div className="space-y-1">
			<Badge variant={statusBadgeVariant(row.status)}>{getSignupStatusDisplayLabel(row.status)}</Badge>
			{trialLine && <div className="text-xs text-muted-foreground">{trialLine}</div>}
		</div>
	);
}

interface SignupNameCellProps {
	row: SignupRequestRowBase;
}

export function SignupRequestNameCell({ row }: SignupNameCellProps) {
	return (
		<div>
			<div className="font-medium">
				{row.first_name} {row.last_name}
			</div>
			<div className="text-xs text-muted-foreground">{row.email}</div>
		</div>
	);
}
