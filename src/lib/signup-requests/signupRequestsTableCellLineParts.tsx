import { Badge } from '@/components/ui/badge';
import type { SignupLessonTypeCellLine } from '@/lib/signup-requests/signupRequestsTableCellHelpers';

interface SignupLessonTypeCellLineItemProps {
	line: SignupLessonTypeCellLine;
}

export function signupLessonTypeCellLineKey(line: SignupLessonTypeCellLine): string {
	if (line.kind === 'text') return `text:${line.text}:${line.muted ? 'muted' : 'plain'}`;
	if (line.kind === 'waitlist-badge') return 'waitlist-badge';
	return `sepa:${line.iban}`;
}

export function SignupLessonTypeCellLineItem({ line }: SignupLessonTypeCellLineItemProps) {
	const lineKey = signupLessonTypeCellLineKey(line);

	if (line.kind === 'text') {
		return (
			<div key={lineKey} className={line.muted ? 'text-xs text-muted-foreground' : undefined}>
				{line.text}
			</div>
		);
	}
	if (line.kind === 'waitlist-badge') {
		return (
			<Badge key={lineKey} variant="outline">
				Wachtlijst
			</Badge>
		);
	}
	return (
		<div key={lineKey} className="mt-1">
			<Badge variant="secondary" className="font-mono text-[10px]">
				SEPA · {line.iban}
			</Badge>
		</div>
	);
}
