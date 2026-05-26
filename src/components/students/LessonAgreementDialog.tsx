import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LessonTypeBadge } from '@/components/ui/lesson-type-badge';
import { getUserInitials } from '@/components/ui/user-display';
import { useAgreementBillingPreview } from '@/hooks/useAgreementBillingPreview';
import { DAY_NAMES } from '@/lib/date/day-index';
import { getDisplayName } from '@/lib/display-name';
import { frequencyLabels } from '@/lib/frequencies';
import { formatTime } from '@/lib/time/time-format';
import type { LessonAgreementWithTeacher } from '@/types/lesson-agreements';

function formatCents(cents: number): string {
	return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export type { LessonAgreementWithTeacher as LessonAgreement };

interface LessonAgreementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	agreement: LessonAgreementWithTeacher | null;
	/**
	 * Optioneel: ID's nodig om een live incasso-preview te tonen.
	 * Wanneer opgegeven verschijnt het blok "Incasso-preview" met
	 * jaar/maandbedrag op basis van prijs per les × frequentie.
	 */
	studentUserId?: string;
	lessonTypeId?: string;
}

function formatDate(date: string): string {
	return new Date(date).toLocaleDateString('nl-NL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

export function LessonAgreementDialog({
	open,
	onOpenChange,
	agreement,
	studentUserId,
	lessonTypeId,
}: LessonAgreementDialogProps) {
	const previewInput = useMemo(() => {
		if (!agreement || !studentUserId || !lessonTypeId) return null;
		return {
			id: agreement.id,
			student_user_id: studentUserId,
			lesson_type_id: lessonTypeId,
			frequency: agreement.frequency,
			duration_minutes: agreement.duration_minutes,
			day_of_week: agreement.day_of_week,
			start_date: agreement.start_date,
			end_date: agreement.end_date,
		};
	}, [agreement, studentUserId, lessonTypeId]);
	const { preview, loading: previewLoading, error: previewError } = useAgreementBillingPreview(previewInput);

	if (!agreement) {
		return null;
	}

	const teacherName = getDisplayName(agreement.teacher);
	const teacherInitials = getUserInitials(agreement.teacher);
	const showPreviewBlock = Boolean(previewInput);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Lesovereenkomst Details</DialogTitle>
					<DialogDescription>Bekijk alle details van deze lesovereenkomst</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Lesson Type */}
					<div className="flex items-center gap-3">
						<LessonTypeBadge lessonType={agreement.lesson_type} size="lg" showName={false} />
						<div>
							<h3 className="font-semibold text-lg">{agreement.lesson_type.name}</h3>
							<Badge variant={agreement.is_active ? 'default' : 'secondary'} className="mt-1">
								{agreement.is_active ? 'Actief' : 'Inactief'}
							</Badge>
						</div>
					</div>

					{/* Teacher */}
					<div className="flex items-center gap-3">
						<Avatar className="h-12 w-12">
							<AvatarImage src={agreement.teacher.avatar_url ?? undefined} alt={teacherName} />
							<AvatarFallback className="bg-primary/10 text-primary">{teacherInitials}</AvatarFallback>
						</Avatar>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Docent</p>
							<p className="font-semibold">{teacherName}</p>
						</div>
					</div>

					{/* Schedule Information */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Dag</p>
							<p className="font-medium">
								{DAY_NAMES[agreement.day_of_week] ?? `Dag ${agreement.day_of_week}`}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Tijd</p>
							<p className="font-medium">{formatTime(agreement.start_time)}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Frequentie</p>
							<p className="font-medium">{frequencyLabels[agreement.frequency]}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Lesduur</p>
							<p className="font-medium">{agreement.duration_minutes} min</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Startdatum</p>
							<p className="font-medium">{formatDate(agreement.start_date)}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Einddatum</p>
							<p className="font-medium">
								{agreement.end_date ? formatDate(agreement.end_date) : 'Geen einddatum'}
							</p>
						</div>
					</div>

					{/* Incasso-preview */}
					{showPreviewBlock && (
						<div className="rounded-md border bg-muted/30 p-4">
							<p className="text-sm font-medium text-muted-foreground mb-3">Incasso-preview</p>
							{previewLoading && <p className="text-sm text-muted-foreground">Berekenen…</p>}
							{!previewLoading && previewError && (
								<p className="text-sm text-destructive">{previewError}</p>
							)}
							{!previewLoading && !previewError && preview && (
								<div className="grid gap-3 sm:grid-cols-2">
									<div>
										<p className="text-xs font-medium text-muted-foreground">Schooljaar</p>
										<p className="font-medium">{preview.schoolYearLabel}</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">Tarief</p>
										<p className="font-medium">
											{preview.tariff === 'under_21' ? '< 21 jaar' : '21+ jaar'} —{' '}
											{formatCents(preview.pricePerLessonCents)} per les
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">Lessen dit jaar</p>
										<p className="font-medium">{preview.lessonsCount}</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">Jaarbedrag</p>
										<p className="font-medium">{formatCents(preview.yearlyCents)}</p>
									</div>
									<div className="sm:col-span-2">
										<p className="text-xs font-medium text-muted-foreground">
											Maandbedrag (× 11, augustus geen incasso)
										</p>
										<p className="font-semibold text-base">
											{formatCents(preview.monthlyCents)}
											{preview.leftoverCents > 0 && (
												<span className="text-xs font-normal text-muted-foreground ml-2">
													(laatste maand +{formatCents(preview.leftoverCents)})
												</span>
											)}
										</p>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Notes */}
					{agreement.notes && (
						<div>
							<p className="text-sm font-medium text-muted-foreground mb-2">Notities</p>
							<div className="rounded-md border bg-muted/50 p-3">
								<p className="text-sm whitespace-pre-wrap">{agreement.notes}</p>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
