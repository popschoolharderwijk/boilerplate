import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TeacherProfileForm } from '@/components/teachers/TeacherProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
	resolveTeacherProfileSaveErrorLabel,
	runTeacherProfileSave,
} from '@/lib/teachers/teacherProfileSaveActionHelpers';
import {
	applyTeacherProfileInitials,
	createTeacherProfileFormState,
	mapLoadedTeacherProfile,
	shouldFetchTeacherProfile,
	shouldStartProfileLoading,
	type TeacherProfileFormValues,
	type TeacherProfileInitials,
} from '@/lib/teachers/teacherProfileSectionHelpers';

interface TeacherProfileSectionProps {
	teacherUserId: string;
	user_id: string;
	canEdit: boolean;
	onUpdate?: () => void;
	initialBio?: string | null;
	initialFirstName?: string | null;
	initialLastName?: string | null;
	initialPhoneNumber?: string | null;
	initialHasVog?: boolean | null;
	initialVogExpiresAt?: string | null;
}

async function loadTeacherProfileData(teacherUserId: string, userId: string) {
	const { data: teacherData, error: teacherError } = await supabase
		.from('teachers')
		.select('bio')
		.eq('user_id', teacherUserId)
		.single();

	if (teacherError) throw teacherError;

	const { data: profileData, error: profileError } = await supabase
		.from('profiles')
		.select('first_name, last_name, phone_number')
		.eq('user_id', userId)
		.single();

	if (profileError) throw profileError;

	return mapLoadedTeacherProfile(teacherData, profileData);
}

function applyLoadedProfile(setForm: (values: TeacherProfileFormValues) => void, loaded: TeacherProfileFormValues) {
	setForm({
		bio: loaded.bio,
		hasVog: loaded.hasVog,
		vogExpiresAt: loaded.vogExpiresAt,
		firstName: loaded.firstName,
		lastName: loaded.lastName,
		phoneNumber: loaded.phoneNumber,
	});
}

export function TeacherProfileSection({
	teacherUserId,
	user_id,
	canEdit,
	onUpdate,
	initialBio,
	initialFirstName,
	initialLastName,
	initialPhoneNumber,
	initialHasVog,
	initialVogExpiresAt,
}: TeacherProfileSectionProps) {
	const { user } = useAuth();
	const profileInitials: TeacherProfileInitials = useMemo(
		() => ({
			initialBio,
			initialFirstName,
			initialLastName,
			initialPhoneNumber,
			initialHasVog,
			initialVogExpiresAt,
		}),
		[initialBio, initialFirstName, initialLastName, initialPhoneNumber, initialHasVog, initialVogExpiresAt],
	);

	const [form, setForm] = useState<TeacherProfileFormValues>(() => createTeacherProfileFormState(profileInitials));
	const [loading, setLoading] = useState(shouldStartProfileLoading(profileInitials));
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!shouldFetchTeacherProfile(profileInitials, teacherUserId, user_id)) return;

		setLoading(true);
		void loadTeacherProfileData(teacherUserId, user_id)
			.then((loaded) => {
				applyLoadedProfile(setForm, loaded);
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error loading profile:', error);
				toast.error('Fout bij laden profiel');
				setLoading(false);
			});
	}, [profileInitials, teacherUserId, user_id]);

	useEffect(() => {
		setForm((current) => applyTeacherProfileInitials(current, profileInitials));
	}, [profileInitials]);

	const runAction = async () => {
		setSaving(true);
		const result = await runTeacherProfileSave({
			supabase,
			teacherUserId,
			userId: user_id,
			canEdit,
			hasUser: !!user,
			form,
		});
		setSaving(false);

		if (!result.saved) {
			if ('error' in result) {
				console.error(`Error updating ${result.error}:`, result.message);
				const label = resolveTeacherProfileSaveErrorLabel(result.error);
				toast.error(`Fout bij bijwerken ${label}`, { description: result.message });
			}
			return;
		}

		toast.success('Profiel bijgewerkt');
		onUpdate?.();
	};

	if (loading) {
		return <SectionSkeleton />;
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle>Persoonlijke gegevens</CardTitle>
			</CardHeader>
			<CardContent>
				<TeacherProfileForm
					firstName={form.firstName}
					lastName={form.lastName}
					phoneNumber={form.phoneNumber}
					bio={form.bio}
					hasVog={form.hasVog}
					vogExpiresAt={form.vogExpiresAt}
					canEdit={canEdit}
					saving={saving}
					onFirstNameChange={(value) => setForm((current) => ({ ...current, firstName: value }))}
					onLastNameChange={(value) => setForm((current) => ({ ...current, lastName: value }))}
					onPhoneNumberChange={(value) => setForm((current) => ({ ...current, phoneNumber: value }))}
					onBioChange={(value) => setForm((current) => ({ ...current, bio: value }))}
					onHasVogChange={(value) => setForm((current) => ({ ...current, hasVog: value }))}
					onVogExpiresAtChange={(value) => setForm((current) => ({ ...current, vogExpiresAt: value }))}
					onSave={() => void runAction()}
				/>
			</CardContent>
		</Card>
	);
}
