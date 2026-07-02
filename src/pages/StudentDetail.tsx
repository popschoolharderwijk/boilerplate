import { useCallback, useEffect, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import { SignupRequestItem } from '@/components/students/SignupRequestItem';
import { StudentAgreementsCard, StudentSignupRequestsCard } from '@/components/students/StudentProfileCards';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayName } from '@/lib/display-name';
import { fetchSignupRequestsByEmail } from '@/lib/signup-requests/signupRequestMappers';
import { fetchStudentAgreementsWithRelations } from '@/lib/students/fetchStudentAgreements';
import type { LessonAgreementWithTeacher } from '@/types/lesson-agreements';

interface ProfileData {
	user_id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
	avatar_url: string | null;
}

export default function StudentDetail() {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const { isPrivileged, isTeacher, isLoading: authLoading } = useAuth();
	const canView = isPrivileged || isTeacher;
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [agreements, setAgreements] = useState<LessonAgreementWithTeacher[]>([]);
	const [signupRequests, setSignupRequests] = useState<SignupRequestDetail[]>([]);

	const load = useCallback(async () => {
		if (!userId) return;
		setLoading(true);
		try {
			const { data: profileData, error: profileError } = await supabase
				.from('profiles')
				.select('user_id, email, first_name, last_name, phone_number, avatar_url')
				.eq('user_id', userId)
				.maybeSingle();
			if (profileError || !profileData) {
				toast.error('Leerling niet gevonden');
				setLoading(false);
				return;
			}
			setProfile(profileData);

			const [agreementsData, signupData] = await Promise.all([
				fetchStudentAgreementsWithRelations(userId),
				profileData.email ? fetchSignupRequestsByEmail(profileData.email) : Promise.resolve([]),
			]);
			setAgreements(agreementsData);
			setSignupRequests(signupData);
			setLoading(false);
		} catch (e) {
			console.error(e);
			toast.error('Fout bij laden leerling');
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		if (!authLoading && canView) load();
	}, [authLoading, canView, load]);

	if (!authLoading && !canView) return <Navigate to="/" replace />;

	if (loading || authLoading) return <PageSkeleton variant="header-and-cards" />;
	if (!profile) return <Navigate to="/students" replace />;

	const displayName = getDisplayName(profile);
	const initials = (profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '');

	return (
		<div className="space-y-6">
			<Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
				<LuArrowLeft className="h-4 w-4 mr-1" /> Terug naar leerlingen
			</Button>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-4">
						<Avatar className="h-16 w-16">
							<AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
							<AvatarFallback className="bg-primary/10 text-primary text-lg">
								{initials.toUpperCase() || profile.email.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle className="text-2xl">{displayName}</CardTitle>
							<CardDescription>
								{profile.email}
								{profile.phone_number ? ` · ${profile.phone_number}` : ''}
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
