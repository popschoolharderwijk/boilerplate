import type { LessonAgreement } from '@/components/students/LessonAgreementItem';
import { LessonAgreementItem } from '@/components/students/LessonAgreementItem';
import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentAgreementsCardProps {
	agreements: LessonAgreement[];
	description: string;
	emptyMessage: string;
	studentUserId?: string;
}

export function StudentAgreementsCard({
	agreements,
	description,
	emptyMessage,
	studentUserId,
}: StudentAgreementsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Lesovereenkomsten</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{agreements.length === 0 ? (
					<p className="text-sm text-muted-foreground">{emptyMessage}</p>
				) : (
					<div className="space-y-4">
						{agreements.map((agreement) => (
							<LessonAgreementItem
								key={agreement.id}
								agreement={agreement}
								studentUserId={studentUserId}
								lessonTypeId={agreement.lesson_type.id}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface StudentSignupRequestsCardProps {
	requests: SignupRequestDetail[];
	description: string;
	emptyMessage: string;
	renderItem: (request: SignupRequestDetail) => React.ReactNode;
}

export function StudentSignupRequestsCard({
	requests,
	description,
	emptyMessage,
	renderItem,
}: StudentSignupRequestsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Aanmeldingen</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{requests.length === 0 ? (
					<p className="text-sm text-muted-foreground">{emptyMessage}</p>
				) : (
					<div className="flex flex-wrap gap-2">{requests.map((request) => renderItem(request))}</div>
				)}
			</CardContent>
		</Card>
	);
}
