import { useEffect, useState } from 'react';
import { LuMonitor, LuMoon, LuSun, LuTrash2, LuTriangleAlert, LuUpload } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserInitials } from '@/components/ui/user-display';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { removeUserAvatarFiles } from '@/lib/storage/avatars';
import { cn } from '@/lib/utils';

type AccountTab = 'profile' | 'appearance' | 'danger';

type AccountAction = 'save-profile' | 'upload-avatar' | 'delete-avatar' | 'delete-account';

type ProfileState = {
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
	avatar_url: string | null;
};

type FormData = {
	first_name: string;
	last_name: string;
	phone_number: string;
};

type FormErrors = {
	first_name?: string;
	last_name?: string;
	phone_number?: string;
};

interface AccountProps {
	defaultTab?: AccountTab;
}

const TAB_TITLES: Record<AccountTab, string> = {
	profile: 'Profiel',
	appearance: 'Weergave',
	danger: 'Account',
};

function dispatchProfileUpdated() {
	window.dispatchEvent(new Event('profile-updated'));
}

async function persistProfile(userId: string, formData: FormData): Promise<{ error: string | null }> {
	const normalizedPhone = formData.phone_number || null;
	const { error } = await supabase
		.from('profiles')
		.update({
			first_name: formData.first_name || null,
			last_name: formData.last_name || null,
			phone_number: normalizedPhone,
		})
		.eq('user_id', userId);
	return { error: error?.message ?? null };
}

async function persistAvatarUpload(
	userId: string,
	file: File,
): Promise<{ error: string | null; avatarUrl: string | null }> {
	const fileExt = file.name.split('.').pop();
	const filePath = `${userId}.${fileExt}`;
	await removeUserAvatarFiles(userId);
	const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
	if (uploadError) return { error: uploadError.message, avatarUrl: null };
	const {
		data: { publicUrl },
	} = supabase.storage.from('avatars').getPublicUrl(filePath);
	const avatarUrl = `${publicUrl}?t=${Date.now()}`;
	const { error: updateError } = await supabase
		.from('profiles')
		.update({ avatar_url: avatarUrl })
		.eq('user_id', userId);
	return { error: updateError?.message ?? null, avatarUrl: updateError ? null : avatarUrl };
}

async function persistAvatarDelete(userId: string): Promise<{ error: string | null }> {
	const { error: deleteError } = await removeUserAvatarFiles(userId);
	if (deleteError) return { error: deleteError.message };
	const { error: updateError } = await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', userId);
	return { error: updateError?.message ?? null };
}

async function persistAccountDelete(): Promise<{ error: string | null; code?: string }> {
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session) return { error: 'Sessie verlopen' };
	const { data, error: invokeError } = await supabase.functions.invoke('delete-user', { method: 'POST' });
	if (invokeError) {
		return { error: invokeError.message || 'Er is een onbekende fout opgetreden.', code: data?.code };
	}
	return { error: null };
}

function AccountProfileTab({
	profile,
	formData,
	errors,
	saving,
	userInitials,
	onFormDataChange,
	onSave,
	onUploadAvatar,
	onDeleteAvatar,
}: {
	profile: ProfileState | null;
	formData: FormData;
	errors: FormErrors;
	saving: boolean;
	userInitials: string;
	onFormDataChange: (data: FormData, errors: FormErrors) => void;
	onSave: (e: React.FormEvent) => void;
	onUploadAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDeleteAvatar: () => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profiel</CardTitle>
				<CardDescription>Wijzig je persoonlijke informatie</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center gap-4">
					<Avatar className="h-20 w-20">
						<AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
						<AvatarFallback className="bg-primary text-primary-foreground text-lg">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div className="space-y-2">
						<Label htmlFor="avatar-upload">Profielfoto</Label>
						<div className="flex items-center gap-2">
							<Input
								id="avatar-upload"
								type="file"
								accept="image/*"
								onChange={onUploadAvatar}
								disabled={saving}
								className="hidden"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => document.getElementById('avatar-upload')?.click()}
								disabled={saving}
							>
								<LuUpload className="mr-2 h-4 w-4" />
								Upload avatar
							</Button>
							{profile?.avatar_url && (
								<Button
									type="button"
									variant="outline"
									onClick={onDeleteAvatar}
									disabled={saving}
									className="text-destructive hover:text-destructive"
								>
									<LuTrash2 className="mr-2 h-4 w-4" />
									Verwijderen
								</Button>
							)}
						</div>
						<p className="text-xs text-muted-foreground">JPG, PNG of GIF. Max 5MB.</p>
					</div>
				</div>

				<form onSubmit={onSave} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="first_name">Voornaam</Label>
							<Input
								id="first_name"
								value={formData.first_name}
								onChange={(e) => onFormDataChange({ ...formData, first_name: e.target.value }, errors)}
								disabled={saving}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="last_name">Achternaam</Label>
							<Input
								id="last_name"
								value={formData.last_name}
								onChange={(e) => onFormDataChange({ ...formData, last_name: e.target.value }, errors)}
								disabled={saving}
							/>
						</div>
					</div>

					<PhoneInput
						id="phone_number"
						label="Telefoonnummer"
						value={formData.phone_number}
						onChange={(value) => {
							const nextErrors = { ...errors };
							if (value && value.length !== 10) {
								nextErrors.phone_number = 'Telefoonnummer moet precies 10 cijfers zijn';
							} else {
								nextErrors.phone_number = undefined;
							}
							onFormDataChange({ ...formData, phone_number: value }, nextErrors);
						}}
						error={errors.phone_number}
						disabled={saving}
					/>

					<Button type="submit" disabled={saving}>
						{saving ? 'Opslaan...' : 'Opslaan'}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function AccountAppearanceTab({
	theme,
	onThemeChange,
}: {
	theme: string;
	onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Thema</CardTitle>
				<CardDescription>Kies je voorkeur voor licht of donker thema</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className={cn('flex-1', theme === 'light' && 'border-primary bg-primary/10')}
						onClick={() => onThemeChange('light')}
					>
						<LuSun className="mr-2 h-4 w-4" />
						Licht
					</Button>
					<Button
						variant="outline"
						className={cn('flex-1', theme === 'dark' && 'border-primary bg-primary/10')}
						onClick={() => onThemeChange('dark')}
					>
						<LuMoon className="mr-2 h-4 w-4" />
						Donker
					</Button>
					<Button
						variant="outline"
						className={cn('flex-1', theme === 'system' && 'border-primary bg-primary/10')}
						onClick={() => onThemeChange('system')}
					>
						<LuMonitor className="mr-2 h-4 w-4" />
						Systeem
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function AccountDangerTab({ deleting, onDeleteClick }: { deleting: boolean; onDeleteClick: () => void }) {
	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">Gevarenzone</CardTitle>
				<CardDescription>Onomkeerbare acties voor je account</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium">Account verwijderen</p>
						<p className="text-sm text-muted-foreground">
							Verwijder je account en alle bijbehorende gegevens permanent.
						</p>
					</div>
					<Button variant="destructive" onClick={onDeleteClick} disabled={deleting}>
						<LuTrash2 className="mr-2 h-4 w-4" />
						Verwijder account
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function AccountDeleteDialog({
	open,
	userEmail,
	deleteConfirmEmail,
	deleting,
	onOpenChange,
	onConfirmEmailChange,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	userEmail: string | null | undefined;
	deleteConfirmEmail: string;
	deleting: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirmEmailChange: (email: string) => void;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<LuTriangleAlert className="h-5 w-5" />
						Account verwijderen
					</DialogTitle>
					<DialogDescription>
						Dit is een onomkeerbare actie. Al je gegevens worden permanent verwijderd, inclusief je profiel,
						instellingen en alle gekoppelde data.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<Alert variant="error" title="Let op!">
						Na het verwijderen van je account kun je dit niet meer ongedaan maken.
					</Alert>
					<div className="space-y-2">
						<Label htmlFor="confirm-email">
							Typ je e-mailadres ter bevestiging: <span className="font-mono">{userEmail}</span>
						</Label>
						<Input
							id="confirm-email"
							type="email"
							value={deleteConfirmEmail}
							onChange={(e) => onConfirmEmailChange(e.target.value)}
							placeholder="Voer je e-mailadres in"
							disabled={deleting}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={deleting}>
						Annuleren
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={deleting || deleteConfirmEmail !== userEmail}
					>
						{deleting ? 'Verwijderen...' : 'Definitief verwijderen'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Account({ defaultTab = 'profile' }: AccountProps) {
	const { theme, setTheme } = useTheme();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [profile, setProfile] = useState<ProfileState | null>(null);
	const [formData, setFormData] = useState<FormData>({
		first_name: '',
		last_name: '',
		phone_number: '',
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!user) return;
		setLoading(true);
		void supabase
			.from('profiles')
			.select('first_name, last_name, phone_number, avatar_url')
			.eq('user_id', user.id)
			.single()
			.then(({ data, error }) => {
				if (error) {
					console.error('Error loading profile:', error);
				} else if (data) {
					setProfile(data);
					setFormData({
						first_name: data.first_name || '',
						last_name: data.last_name || '',
						phone_number: data.phone_number || '',
					});
				}
				setLoading(false);
			});
	}, [user]);

	const runAccountAction = async (
		action: AccountAction,
		payload?: React.FormEvent | React.ChangeEvent<HTMLInputElement>,
	) => {
		if (!user) return;

		if (action === 'save-profile') {
			const e = payload as React.FormEvent;
			e.preventDefault();
			const newErrors: FormErrors = {};
			if (formData.phone_number && formData.phone_number.length !== 10) {
				newErrors.phone_number = 'Telefoonnummer moet precies 10 cijfers zijn';
			}
			setErrors(newErrors);
			if (Object.keys(newErrors).length > 0) return;

			setSaving(true);
			const { error } = await persistProfile(user.id, formData);
			if (error) {
				toast.error('Fout bij opslaan', { description: error });
			} else if (profile) {
				setProfile({
					...profile,
					first_name: formData.first_name || null,
					last_name: formData.last_name || null,
					phone_number: formData.phone_number || null,
				});
				toast.success('Profiel opgeslagen!');
				dispatchProfileUpdated();
			}
			setSaving(false);
			return;
		}

		if (action === 'upload-avatar') {
			const e = payload as React.ChangeEvent<HTMLInputElement>;
			if (!e.target.files || e.target.files.length === 0) return;
			setSaving(true);
			const { error, avatarUrl } = await persistAvatarUpload(user.id, e.target.files[0]);
			if (error) {
				toast.error('Fout bij uploaden avatar', { description: error });
			} else if (profile && avatarUrl) {
				setProfile({ ...profile, avatar_url: avatarUrl });
				toast.success('Avatar opgeslagen!');
				dispatchProfileUpdated();
			}
			setSaving(false);
			return;
		}

		if (action === 'delete-avatar') {
			setSaving(true);
			const { error } = await persistAvatarDelete(user.id);
			if (error) {
				toast.error('Fout bij verwijderen avatar', { description: error });
			} else if (profile) {
				setProfile({ ...profile, avatar_url: null });
				toast.success('Avatar verwijderd!');
				dispatchProfileUpdated();
			}
			setSaving(false);
			return;
		}

		setDeleting(true);
		try {
			const { error, code } = await persistAccountDelete();
			if (error) {
				if (code === 'last_site_admin') {
					toast.error('Kan account niet verwijderen', { description: error });
				} else if (error === 'Sessie verlopen') {
					toast.error('Sessie verlopen', { description: 'Log opnieuw in en probeer het nogmaals.' });
				} else {
					toast.error('Fout bij verwijderen account', { description: error });
				}
				setDeleting(false);
				return;
			}
			toast.success('Account verwijderd', {
				description: 'Je account en alle bijbehorende gegevens zijn verwijderd.',
			});
			await supabase.auth.signOut();
			navigate('/login');
		} catch (error) {
			console.error('Error deleting account:', error);
			toast.error('Fout bij verwijderen account', {
				description: 'Er is een netwerkfout opgetreden. Probeer het later opnieuw.',
			});
			setDeleting(false);
		}
	};

	const userInitials = getUserInitials({
		first_name: profile?.first_name ?? null,
		last_name: profile?.last_name ?? null,
		email: user?.email ?? null,
	});

	if (loading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{TAB_TITLES[defaultTab]}</h1>
					<p className="text-muted-foreground">Beheer je voorkeuren en accountinstellingen</p>
				</div>
				<p>Laden...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{TAB_TITLES[defaultTab]}</h1>
				<p className="text-muted-foreground">Beheer je voorkeuren en accountinstellingen</p>
			</div>

			<Tabs
				defaultValue={defaultTab}
				onValueChange={(v) => {
					if (v === 'profile') navigate('/account/profile', { replace: true });
					if (v === 'appearance') navigate('/account/appearance', { replace: true });
					if (v === 'danger') navigate('/account/danger', { replace: true });
				}}
			>
				<TabsList>
					<TabsTrigger value="profile">Profiel</TabsTrigger>
					<TabsTrigger value="appearance">Weergave</TabsTrigger>
					<TabsTrigger value="danger">Account</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-6 mt-6">
					<AccountProfileTab
						profile={profile}
						formData={formData}
						errors={errors}
						saving={saving}
						userInitials={userInitials}
						onFormDataChange={(data, nextErrors) => {
							setFormData(data);
							setErrors(nextErrors);
						}}
						onSave={(e) => runAccountAction('save-profile', e)}
						onUploadAvatar={(e) => runAccountAction('upload-avatar', e)}
						onDeleteAvatar={() => runAccountAction('delete-avatar')}
					/>
				</TabsContent>

				<TabsContent value="appearance" className="space-y-6 mt-6">
					<AccountAppearanceTab theme={theme} onThemeChange={setTheme} />
				</TabsContent>

				<TabsContent value="danger" className="space-y-6 mt-6">
					<AccountDangerTab deleting={deleting} onDeleteClick={() => setDeleteDialogOpen(true)} />
				</TabsContent>
			</Tabs>

			<AccountDeleteDialog
				open={deleteDialogOpen}
				userEmail={user?.email}
				deleteConfirmEmail={deleteConfirmEmail}
				deleting={deleting}
				onOpenChange={setDeleteDialogOpen}
				onConfirmEmailChange={setDeleteConfirmEmail}
				onCancel={() => {
					setDeleteDialogOpen(false);
					setDeleteConfirmEmail('');
				}}
				onConfirm={() => runAccountAction('delete-account')}
			/>
		</div>
	);
}
