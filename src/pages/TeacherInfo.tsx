import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AgendaView } from '@/components/agenda/AgendaView';
import { TeacherAvailabilitySection } from '@/components/teachers/TeacherAvailabilitySection';
import { TeacherLessonTypesSection } from '@/components/teachers/TeacherLessonTypesSection';
import { TeacherProfileSection } from '@/components/teachers/TeacherProfileSection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Teacher } from '@/types/teachers';

export default function TeacherInfo() {
	const { id } = useParams<{ id: string }>();
	const { isTeacher, teacherUserId, isAdmin, isSiteAdmin, isLoading: authLoading } = useAuth();
	const [loading, setLoading] = useState(true);
	const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
	const [targetTeacherUserId, setTargetTeacherUserId] = useState<string | null>(null);
	const [profileVersion, setProfileVersion] = useState(0);

	useEffect(() => {
		if (authLoading) return;

		if (id) {
			setTargetTeacherUserId(id);
			return;
		}

		if (isTeacher && teacherUserId) {
			setTargetTeacherUserId(teacherUserId);
			return;
		}

		setTargetTeacherUserId(null);
	}, [id, isTeacher, teacherUserId, authLoading]);

	useEffect(() => {
		if (!targetTeacherUserId) return;
		void profileVersion;

		setLoading(true);
		void supabase
			.from('teachers')
			.select('user_id, bio, is_active, created_at, updated_at')
			.eq('user_id', targetTeacherUserId)
			.single()
			.then(({ data: teacherData, error: teacherError }) => {
				if (teacherError) {
					console.error('Error loading teacher:', teacherError);
					setLoading(false);
					return;
				}

				void supabase
					.from('profiles')
					.select('user_id, first_name, last_name, email, avatar_url, phone_number')
					.eq('user_id', teacherData.user_id)
					.single()
					.then(({ data: profileData, error: profileError }) => {
						if (profileError) {
							console.error('Error loading profile:', profileError);
						} else {
							setTeacherProfile({
								...teacherData,
								...profileData,
							} as Teacher);
						}
						setLoading(false);
					});
			});
	}, [targetTeacherUserId, profileVersion]);

	const { setBreadcrumbSuffix } = useBreadcrumb();
	useEffect(() => {
		if (!teacherProfile) {
			setBreadcrumbSuffix([]);
			return;
		}
		const name =
			teacherProfile.first_name && teacherProfile.last_name
				? `${teacherProfile.first_name} ${teacherProfile.last_name}`
				: teacherProfile.first_name || teacherProfile.email;
		setBreadcrumbSuffix([{ label: name }]);
		return () => setBreadcrumbSuffix([]);
	}, [teacherProfile, setBreadcrumbSuffix]);

	const canAccess =
		!!targetTeacherUserId && (isAdmin || isSiteAdmin || (isTeacher && teacherUserId === targetTeacherUserId));

	if (authLoading || !targetTeacherUserId) {
		return <PageSkeleton variant="header-and-tabs" />;
	}

	if (!canAccess) {
		return <Navigate to="/" replace />;
	}

	if (loading || !teacherProfile) {
		return <PageSkeleton variant="header-and-tabs" />;
	}

	const teacherName =
		teacherProfile.first_name && teacherProfile.last_name
			? `${teacherProfile.first_name} ${teacherProfile.last_name}`
			: teacherProfile.first_name || teacherProfile.email;

	const teacherInitials =
		teacherProfile.first_name && teacherProfile.last_name
			? `${teacherProfile.first_name[0]}${teacherProfile.last_name[0]}`.toUpperCase()
			: teacherProfile.first_name
				? teacherProfile.first_name.slice(0, 2).toUpperCase()
				: teacherProfile.email.slice(0, 2).toUpperCase();

	return (
		<div className="space-y-6">
			<PageHeader
				icon={
					<Avatar className="h-16 w-16">
						<AvatarImage src={teacherProfile.avatar_url ?? undefined} alt={teacherName} />
						<AvatarFallback className="bg-primary/10 text-primary text-xl">
							{teacherInitials}
						</AvatarFallback>
					</Avatar>
				}
				title={teacherName}
				subtitle={teacherProfile.email}
			/>

			<Tabs defaultValue="profile" className="space-y-2">
				<TabsList>
					<TabsTrigger value="profile">Profiel</TabsTrigger>
					<TabsTrigger value="agenda">Agenda</TabsTrigger>
				</TabsList>

				<TabsContent value="profile">
					<div className="grid gap-6 lg:grid-cols-2">
						<div className="space-y-6 min-w-0">
							<TeacherProfileSection
								teacherUserId={targetTeacherUserId}
								user_id={teacherProfile.user_id}
								canEdit={canAccess}
								onUpdate={() => setProfileVersion((v) => v + 1)}
								initialBio={teacherProfile.bio}
								initialFirstName={teacherProfile.first_name}
								initialLastName={teacherProfile.last_name}
								initialPhoneNumber={teacherProfile.phone_number}
								initialHasVog={teacherProfile.has_vog}
							/>
							<TeacherLessonTypesSection teacherUserId={targetTeacherUserId} canEdit={canAccess} />
							<div className="text-xs italic text-muted-foreground space-y-1">
								<p>Aangemaakt: {new Date(teacherProfile.created_at).toLocaleString('nl-NL')}</p>
								<p>Laatst bijgewerkt: {new Date(teacherProfile.updated_at).toLocaleString('nl-NL')}</p>
							</div>
						</div>

						<div className="min-w-0">
							<TeacherAvailabilitySection teacherUserId={targetTeacherUserId} canEdit={canAccess} />
						</div>
					</div>
				</TabsContent>

				<TabsContent value="agenda">
					<AgendaView userId={targetTeacherUserId} canEdit={canAccess} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
