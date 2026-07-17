import { buildSignupLessonTypeCellLines } from '@/lib/signup-requests/signupRequestsTableCellHelpers';
import {
	SignupLessonTypeCellLineItem,
	signupLessonTypeCellLineKey,
} from '@/lib/signup-requests/signupRequestsTableCellLineParts';
import type { SignupLessonTypeCellContent } from '@/lib/signup-requests/signupRequestsTableFormatters';

interface SignupLessonTypeCellLinesProps {
	content: SignupLessonTypeCellContent;
}

export function SignupLessonTypeCellLines({ content }: SignupLessonTypeCellLinesProps) {
	const lines = buildSignupLessonTypeCellLines(content);

	return (
		<div>
			{lines.map((line) => (
				<SignupLessonTypeCellLineItem key={signupLessonTypeCellLineKey(line)} line={line} />
			))}
		</div>
	);
}
