import { Button } from '@/components/ui/button';
import type { EnrichedTrialLessonStaff } from '@/lib/trial-lessons/enrichTrialLessons';
import {
	showTrialAgreementButton,
	showTrialCancelButton,
	showTrialGivenButton,
} from '@/lib/trial-lessons/trialLessonsPageHelpers';

interface TrialLessonsActionsCellProps {
	row: EnrichedTrialLessonStaff;
	onSetStatus: (row: EnrichedTrialLessonStaff, status: EnrichedTrialLessonStaff['status']) => void;
	onConvert: (row: EnrichedTrialLessonStaff) => void;
}

export function TrialLessonsActionsCell({ row, onSetStatus, onConvert }: TrialLessonsActionsCellProps) {
	return (
		<div className="flex gap-2 justify-end whitespace-nowrap">
			{showTrialGivenButton(row.status) && (
				<Button size="sm" variant="outline" onClick={() => onSetStatus(row, 'completed')}>
					Gegeven
				</Button>
			)}
			{showTrialAgreementButton(row.status) && (
				<Button size="sm" onClick={() => onConvert(row)}>
					Overeenkomst
				</Button>
			)}
			{showTrialCancelButton(row.status) && (
				<Button size="sm" variant="outline" onClick={() => onSetStatus(row, 'cancelled')}>
					Annuleren
				</Button>
			)}
		</div>
	);
}
