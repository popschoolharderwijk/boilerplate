import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionSkeleton } from '@/components/ui/page-skeleton';
import { PhoneInput } from '@/components/ui/phone-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
	const [bio, setBio] = useState<string>(initialBio || '');
	const [firstName, setFirstName] = useState<string>(initialFirstName || '');
	const [lastName, setLastName] = useState<string>(initialLastName || '');
	const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneNumber || '');
	const [hasVog, setHasVog] = useState<boolean>(initialHasVog ?? false);
	const [vogExpiresAt, setVogExpiresAt] = useState<string>(initialVogExpiresAt ?? '');
	const [loading, setLoading] = useState(!initialBio && !initialFirstName);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (initialBio || initialFirstName || initialLastName || initialPhoneNumber) return;
		if (!teacherUserId || !user_id) return;

		setLoading(true);
		void supabase
			.from('teachers')
			.select('bio, has_vog, vog_expires_at')
			.eq('user_id', teacherUserId)
			.single()
			.then(async ({ data: teacherData, error: teacherError }) => {
				if (teacherError) {
					console.error('Error loading bio:', teacherError);
					toast.error('Fout bij laden profiel');
					setLoading(false);
					return;
				}

				const { data: profileData, error: profileError } = await supabase
					.from('profiles')
					.select('first_name, last_name, phone_number')
					.eq('user_id', user_id)
					.single();

				if (profileError) {
					console.error('Error loading profile:', profileError);
					toast.error('Fout bij laden profiel');
				} else {
					const t = teacherData as unknown as {
						bio: string | null;
						has_vog?: boolean | null;
						vog_expires_at?: string | null;
					} | null;
					setBio(t?.bio || '');
					setHasVog(t?.has_vog ?? false);
					setVogExpiresAt(t?.vog_expires_at ?? '');
					setFirstName(profileData?.first_name || '');
					setLastName(profileData?.last_name || '');
					setPhoneNumber(profileData?.phone_number || '');
				}
				setLoading(false);
			});
	}, [initialBio, initialFirstName, initialLastName, initialPhoneNumber, teacherUserId, user_id]);

	useEffect(() => {
		if (initialBio !== undefined) setBio(initialBio || '');
		if (initialFirstName !== undefined) setFirstName(initialFirstName || '');
		if (initialLastName !== undefined) setLastName(initialLastName || '');
		if (initialPhoneNumber !== undefined) setPhoneNumber(initialPhoneNumber || '');
		if (initialHasVog !== undefined && initialHasVog !== null) setHasVog(initialHasVog);
		if (initialVogExpiresAt !== undefined) setVogExpiresAt(initialVogExpiresAt ?? '');
	}, [initialBio, initialFirstName, initialLastName, initialPhoneNumber, initialHasVog, initialVogExpiresAt]);

	const runAction = async () => {
		if (!teacherUserId || !user_id || !canEdit || !user) return;

		setSaving(true);

		const { error: bioError } = await supabase
			.from('teachers')
			.update({ bio: bio || null, has_vog: hasVog, vog_expires_at: vogExpiresAt || null } as never)
			.eq('user_id', teacherUserId);

		if (bioError) {
			console.error('Error updating bio:', bioError);
			toast.error('Fout bij bijwerken bio', { description: bioError.message });
			setSaving(false);
			return;
		}

		const { error: profileError } = await supabase
			.from('profiles')
			.update({
				first_name: firstName || null,
				last_name: lastName || null,
				phone_number: phoneNumber || null,
			})
			.eq('user_id', user_id);

		if (profileError) {
			console.error('Error updating profile:', profileError);
			toast.error('Fout bij bijwerken profiel', { description: profileError.message });
			setSaving(false);
			return;
		}

		toast.success('Profiel bijgewerkt');
		setSaving(false);
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
			<CardContent className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="first-name">Voornaam</Label>
						<Input
							id="first-name"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							disabled={!canEdit}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="last-name">Achternaam</Label>
						<Input
							id="last-name"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							disabled={!canEdit}
						/>
					</div>
				</div>
				<PhoneInput
					id="phone-number"
					label="Telefoonnummer"
					value={phoneNumber}
					onChange={(value) => setPhoneNumber(value)}
					disabled={!canEdit}
				/>
				<div className="space-y-2">
					<Label htmlFor="bio">Biografie</Label>
					<Textarea
						id="bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						placeholder="Korte beschrijving van jezelf..."
						rows={3}
						disabled={!canEdit}
						className="resize-none"
					/>
				</div>
				<div className="space-y-2">
					<label className="flex items-center gap-2 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={hasVog}
							onChange={(e) => setHasVog(e.target.checked)}
							disabled={!canEdit}
							className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<span className="text-sm font-medium">VOG aanwezig</span>
					</label>
					{hasVog && (
						<div className="space-y-2">
							<Label htmlFor="vog-expires-at">VOG geldig tot</Label>
							<Input
								id="vog-expires-at"
								type="date"
								value={vogExpiresAt}
								onChange={(e) => setVogExpiresAt(e.target.value)}
								disabled={!canEdit}
								className="max-w-xs"
							/>
						</div>
					)}
				</div>
				{canEdit && (
					<SubmitButton onClick={() => runAction()} loading={saving} size="sm" loadingLabel="Opslaan...">
						Opslaan
					</SubmitButton>
				)}
			</CardContent>
		</Card>
	);
}
