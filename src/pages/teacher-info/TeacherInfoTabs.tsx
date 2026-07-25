import { AgendaView } from '@/components/agenda/AgendaView';
import { TeacherAvailabilitySection } from '@/components/teachers/TeacherAvailabilitySection';
import { TeacherLessonTypesSection } from '@/components/teachers/TeacherLessonTypesSection';
import { TeacherProfileSection } from '@/components/teachers/TeacherProfileSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Teacher } from '@/types/teachers';

interface TeacherInfoTabsProps {
	targetTeacherUserId: string;
	teacherProfile: Teacher;
	canAccess: boolean;
	onProfileUpdate: () => void;
}

export function TeacherInfoTabs({
	targetTeacherUserId,
	teacherProfile,
	canAccess,
	onProfileUpdate,
}: TeacherInfoTabsProps) {
	return (
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
							onUpdate={onProfileUpdate}
							initialBio={teacherProfile.bio}
							initialFirstName={teacherProfile.first_name}
							initialLastName={teacherProfile.last_name}
							initialPhoneNumber={teacherProfile.phone_number}
							initialHasVog={(teacherProfile as Teacher & { has_vog?: boolean | null }).has_vog ?? false}
							initialVogExpiresAt={
								(teacherProfile as Teacher & { vog_expires_at?: string | null }).vog_expires_at ?? null
							}
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
	);
}
