import type { DataTableColumn } from '@/components/ui/data-table';
import { formatDbDateLong } from '@/lib/date/date-format';
import type { SignupRequestRowBase } from '@/lib/signup-requests/signupRequestsPageHelpers';
import {
	SignupRequestActionsCell,
	SignupRequestLessonTypeCell,
	SignupRequestNameCell,
	SignupRequestStatusCell,
} from '@/lib/signup-requests/signupRequestsTableCellRenderers';

export type SignupAction =
	| { kind: 'reject'; row: SignupRequestRowBase }
	| { kind: 'process'; row: SignupRequestRowBase };

export function buildSignupRequestColumns(
	busyId: string | null,
	runAction: (action: SignupAction) => void,
	setTrialFor: (row: SignupRequestRowBase) => void,
): DataTableColumn<SignupRequestRowBase>[] {
	return [
		{
			key: 'created_at',
			label: 'Ontvangen',
			render: (row) => <span className="text-sm">{formatDbDateLong(row.created_at)}</span>,
		},
		{
			key: 'name',
			label: 'Aanmelder',
			render: (row) => <SignupRequestNameCell row={row} />,
		},
		{
			key: 'type',
			label: 'Lessoort',
			render: (row) => <SignupRequestLessonTypeCell row={row} />,
		},
		{
			key: 'status',
			label: 'Status',
			render: (row) => <SignupRequestStatusCell row={row} formatDate={formatDbDateLong} />,
		},
		{
			key: 'actions',
			label: '',
			render: (row) => (
				<SignupRequestActionsCell row={row} busyId={busyId} runAction={runAction} setTrialFor={setTrialFor} />
			),
		},
	];
}
