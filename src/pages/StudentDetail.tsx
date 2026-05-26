import { useCallback, useEffect, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LessonAgreementItem } from '@/components/students/LessonAgreementItem';
import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import { SignupRequestItem } from '@/components/students/SignupRequestItem';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayName } from '@/lib/display-name';
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
	const { n, isTeacher, isLoading: authLoading } = useAuth();
	const canView = n || isTeacher;
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

			// Load agreements
			const { data: agreementsData } = await supabase
				.from('lesson_agreements')
				.select(
					`id, day_of_week, start_time, start_date, end_date, is_active, notes, duration_minutes, frequency, price_per_lesson,
					teachers!inner (profiles!inner (first_name, last_name, avatar_url)),
					lesson_types!inner (id, name, icon, color)`,
				)
				.eq('student_user_id', userId)
				.order('is_active', { ascending: false })
				.order('start_date', { ascending: false });

			type AgreementRow = {
				id: string;
				day_of_week: number;
				start_time: string;
				start_date: string;
				end_date: string | null;
				is_active: boolean;
				notes: string | null;
				duration_minutes: number;
				frequency: LessonAgreementWithTeacher['frequency'];
				price_per_lesson: number;
				teachers?: {
					profiles?:
						| { first_name: string | null; last_name: string | null; avatar_url: string | null }
						| { first_name: string | null; last_name: string | null; avatar_url: string | null }[];
				}[];
				lesson_types?: { id: string; name: string; icon: string | null; color: string | null }[];
			};
			const transformed: LessonAgreementWithTeacher[] = (agreementsData || []).map((a) => {
				const row = a as AgreementRow;
				const t = row.teachers?.[0];
				const profiles = t?.profiles;
				const p = Array.isArray(profiles) ? profiles[0] : profiles;
				const lt = row.lesson_types?.[0];
				return {
					id: row.id,
					day_of_week: row.day_of_week,
					start_time: row.start_time,
					start_date: row.start_date,
					end_date: row.end_date,
					is_active: row.is_active,
					notes: row.notes,
					duration_minutes: row.duration_minutes,
					frequency: row.frequency,
					price_per_lesson: row.price_per_lesson,
					teacher: {
						first_name: p?.first_name ?? null,
						last_name: p?.last_name ?? null,
						avatar_url: p?.avatar_url ?? null,
					},
					lesson_type: {
						id: lt?.id ?? '',
						name: lt?.name ?? '',
						icon: lt?.icon ?? null,
						color: lt?.color ?? null,
					},
				};
			});
			setAgreements(transformed);

			// Load signup requests by email
			if (profileData.email) {
				const { data: reqData } = await supabase
					.from('lesson_signup_requests')
					.select('*, lesson_types(name), lesson_groups(name)')
					.eq('email', profileData.email)
					.order('created_at', { ascending: false });
				setSignupRequests(
					(reqData ?? []).map((r) => {
						const lt = Array.isArray(r.lesson_types) ? r.lesson_types[0] : r.lesson_types;
						const lg = Array.isArray(r.lesson_groups) ? r.lesson_groups[0] : r.lesson_groups;
						return {
							id: r.id,
							first_name: r.first_name,
							last_name: r.last_name,
							email: r.email,
							phone_number: r.phone_number,
							parent_name: r.parent_name,
							parent_email: r.parent_email,
							parent_phone_number: r.parent_phone_number,
							date_of_birth: r.date_of_birth,
							notes: r.notes,
							status: r.status,
							created_at: r.created_at,
							processed_at: r.processed_at,
							lesson_type_name: lt?.name ?? null,
							lesson_group_name: lg?.name ?? null,
						};
					}),
				);
			}
			setLoading(false);
		} catch (e) {
			console.error(e);
			toast.error('Fout bij laden leerling');
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		if (!authLoading && isPrivileged) load();
	}, [authLoading, isPrivileged, load]);

	if (!authLoading && !isPrivileged) return <Navigate to="/" replace />;
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

			<Card>
				<CardHeader>
					<CardTitle>Lesovereenkomsten</CardTitle>
					<CardDescription>Alle overeenkomsten van deze leerling</CardDescription>
				</CardHeader>
				<CardContent>
					{agreements.length === 0 ? (
						<p className="text-sm text-muted-foreground">Geen lesovereenkomsten</p>
					) : (
						<div className="space-y-4">
							{agreements.map((a) => (
								<div key={a.id} className="space-y-2">
									<LessonAgreementItem
										agreement={a}
										studentUserId={userId}
										lessonTypeId={a.lesson_type.id}
									/>
									<SubscriptionCard lessonAgreementId={a.id} />
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Aanmeldingen</CardTitle>
					<CardDescription>Aanmeldingen gekoppeld aan dit e-mailadres</CardDescription>
				</CardHeader>
				<CardContent>
					{signupRequests.length === 0 ? (
						<p className="text-sm text-muted-foreground">Geen aanmeldingen</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{signupRequests.map((r) => (
								<SignupRequestItem key={r.id} request={r} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
