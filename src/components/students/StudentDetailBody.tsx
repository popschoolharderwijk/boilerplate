import { LuArrowLeft } from 'react-icons/lu';
import { SignupRequestItem } from '@/components/students/SignupRequestItem';
import { StudentAgreementsCard, StudentSignupRequestsCard } from '@/components/students/StudentProfileCards';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { useStudentDetailPage } from '@/hooks/useStudentDetailPage';
import { getDisplayName } from '@/lib/display-name';
import {
	buildStudentAvatarFallback,
	buildStudentInitials,
	formatStudentPhoneSubtitle,
	type StudentProfileData,
} from '@/lib/students/studentDetailHelpers';

type StudentDetailPageData = Pick<ReturnType<typeof useStudentDetailPage>, 'userId' | 'agreements' | 'signupRequests'>;

interface StudentDetailBodyProps extends StudentDetailPageData {
	profile: StudentProfileData;
	onBack: () => void;
}

export function StudentDetailBody({ profile, userId, agreements, signupRequests, onBack }: StudentDetailBodyProps) {
	const displayName = getDisplayName(profile);
	const initials = buildStudentInitials(profile);

	return (
		<div className="space-y-6">
			<Button variant="ghost" size="sm" onClick={onBack}>
				<LuArrowLeft className="h-4 w-4 mr-1" /> Terug naar leerlingen
			</Button>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-4">
						<Avatar className="h-16 w-16">
							<AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
							<AvatarFallback className="bg-primary/10 text-primary text-lg">
								{buildStudentAvatarFallback(profile, initials)}
							</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle className="text-2xl">{displayName}</CardTitle>
							<CardDescription>
								{formatStudentPhoneSubtitle(profile.email, profile.phone_number)}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
			</Card>

			<StudentAgreementsCard
				agreements={agreements}
				description="Alle overeenkomsten van deze leerling"
				emptyMessage="Geen lesovereenkomsten"
				studentUserId={userId}
			/>

			<StudentSignupRequestsCard
				requests={signupRequests}
				description="Aanmeldingen gekoppeld aan dit e-mailadres"
				emptyMessage="Geen aanmeldingen"
				renderItem={(request) => <SignupRequestItem key={request.id} request={request} />}
			/>
		</div>
	);
}
