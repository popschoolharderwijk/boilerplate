import { Button } from '@/components/ui/button';
import type { LessonType } from './types';

interface PublicSignupStep1Props {
	lessonTypes: LessonType[];
	selectedType: LessonType | null;
	onSelectType: (lessonType: LessonType) => void;
	onNext: () => void;
}

export function PublicSignupStep1({ lessonTypes, selectedType, onSelectType, onNext }: PublicSignupStep1Props) {
	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">Welke les wil je volgen?</h2>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{lessonTypes.map((lessonType) => (
					<button
						type="button"
						key={lessonType.id}
						onClick={() => onSelectType(lessonType)}
						className={`p-4 rounded-lg border-2 text-left transition ${
							selectedType?.id === lessonType.id
								? 'border-primary bg-primary/5'
								: 'border-border hover:border-primary/50'
						}`}
					>
						<div className="font-medium">{lessonType.name}</div>
						{lessonType.is_group_lesson && (
							<div className="text-xs text-muted-foreground mt-1">Groepsles</div>
						)}
					</button>
				))}
			</div>
			<div className="flex justify-end pt-4">
				<Button disabled={!selectedType} onClick={onNext}>
					Volgende
				</Button>
			</div>
		</div>
	);
}
