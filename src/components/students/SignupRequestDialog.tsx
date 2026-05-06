import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDbDateLong } from '@/lib/date/date-format';

export interface SignupRequestDetail {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string | null;
	parent_name: string | null;
	parent_email: string | null;
	parent_phone_number: string | null;
	date_of_birth: string | null;
	notes: string | null;
	status: 'pending' | 'approved' | 'rejected';
	created_at: string;
	processed_at: string | null;
	lesson_type_name: string | null;
	lesson_group_name: string | null;
}

interface SignupRequestDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	request: SignupRequestDetail | null;
}

const STATUS_LABEL: Record<SignupRequestDetail['status'], string> = {
	pending: 'In behandeling',
	approved: 'Goedgekeurd',
	rejected: 'Afgewezen',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<p className="text-sm">{value || '-'}</p>
		</div>
	);
}

export function SignupRequestDialog({ open, onOpenChange, request }: SignupRequestDialogProps) {
	if (!request) return null;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>Aanmelding details</DialogTitle>
					<DialogDescription>
						Ontvangen op {formatDbDateLong(request.created_at)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="flex items-center gap-2">
						<Badge
							variant={
								request.status === 'pending'
									? 'default'
									: request.status === 'approved'
										? 'secondary'
										: 'outline'
							}
						>
							{STATUS_LABEL[request.status]}
						</Badge>
						{request.processed_at && (
							<span className="text-xs text-muted-foreground">
								Verwerkt op {formatDbDateLong(request.processed_at)}
							</span>
						)}
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Lessoort" value={request.lesson_type_name} />
						<Field label="Groep" value={request.lesson_group_name} />
						<Field label="Naam" value={`${request.first_name} ${request.last_name}`} />
						<Field label="Email" value={request.email} />
						<Field label="Telefoon" value={request.phone_number} />
						<Field
							label="Geboortedatum"
							value={request.date_of_birth ? formatDbDateLong(request.date_of_birth) : null}
						/>
					</div>
					{(request.parent_name || request.parent_email || request.parent_phone_number) && (
						<div className="border-t pt-3">
							<p className="text-sm font-medium mb-2">Ouder/voogd</p>
							<div className="grid grid-cols-2 gap-3">
								<Field label="Naam" value={request.parent_name} />
								<Field label="Email" value={request.parent_email} />
								<Field label="Telefoon" value={request.parent_phone_number} />
							</div>
						</div>
					)}
					{request.notes && (
						<div className="border-t pt-3">
							<p className="text-xs font-medium text-muted-foreground">Opmerkingen</p>
							<p className="text-sm whitespace-pre-line">{request.notes}</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
