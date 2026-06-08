import { useCallback, useRef, useState } from 'react';
import { LuImage, LuLink, LuMegaphone, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { type Announcement, type AnnouncementAudience, useAnnouncements } from '@/hooks/useAnnouncements';
import { supabase } from '@/integrations/supabase/client';
import { formatDbDateToUi } from '@/lib/date/date-format';
import { renderMarkdown } from '@/lib/markdown/render';

interface FormState {
	title: string;
	body: string;
	audienceTeachers: boolean;
	audienceStudents: boolean;
	publish: boolean;
}

const EMPTY_FORM: FormState = {
	title: '',
	body: '',
	audienceTeachers: true,
	audienceStudents: true,
	publish: true,
};

function audienceLabel(audience: AnnouncementAudience[]): string {
	const parts: string[] = [];
	if (audience.includes('teachers')) parts.push('Docenten');
	if (audience.includes('students')) parts.push('Leerlingen');
	return parts.join(' + ') || '—';
}

export function AnnouncementsManager() {
	const { announcements, isLoading, refetch } = useAnnouncements();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Announcement | null>(null);
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
	const [uploading, setUploading] = useState(false);
	const bodyRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const openCreate = () => {
		setEditing(null);
		setForm(EMPTY_FORM);
		setDialogOpen(true);
	};

	const openEdit = (a: Announcement) => {
		setEditing(a);
		setForm({
			title: a.title,
			body: a.body,
			audienceTeachers: a.audience.includes('teachers'),
			audienceStudents: a.audience.includes('students'),
			publish: a.published_at !== null,
		});
		setDialogOpen(true);
	};

	const insertAtCursor = useCallback((snippet: string) => {
		const el = bodyRef.current;
		if (!el) {
			setForm((f) => ({ ...f, body: f.body + snippet }));
			return;
		}
		const start = el.selectionStart ?? el.value.length;
		const end = el.selectionEnd ?? el.value.length;
		const next = el.value.slice(0, start) + snippet + el.value.slice(end);
		setForm((f) => ({ ...f, body: next }));
		requestAnimationFrame(() => {
			el.focus();
			const pos = start + snippet.length;
			el.setSelectionRange(pos, pos);
		});
	}, []);

	const handleInsertLink = () => {
		const url = window.prompt('URL (https://...)');
		if (!url) return;
		const text = window.prompt('Linktekst', url) ?? url;
		insertAtCursor(`[${text}](${url})`);
	};

	const handlePickImage = () => {
		fileInputRef.current?.click();
	};

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			toast.error('Alleen afbeeldingen zijn toegestaan');
			return;
		}
		setUploading(true);
		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
		const path = `${crypto.randomUUID()}.${ext}`;
		const { error: uploadError } = await supabase.storage
			.from('announcement-images')
			.upload(path, file, { upsert: false, contentType: file.type });
		if (uploadError) {
			toast.error('Upload mislukt', { description: uploadError.message });
			setUploading(false);
			return;
		}
		const {
			data: { publicUrl },
		} = supabase.storage.from('announcement-images').getPublicUrl(path);
		insertAtCursor(`![${file.name}](${publicUrl})`);
		setUploading(false);
	};

	const audience: AnnouncementAudience[] = [
		...(form.audienceTeachers ? (['teachers'] as const) : []),
		...(form.audienceStudents ? (['students'] as const) : []),
	];

	const isFormValid = form.title.trim().length > 0 && audience.length > 0;

	const handleSave = async () => {
		if (!isFormValid) return;
		setSaving(true);
		const payload = {
			title: form.title.trim(),
			body: form.body,
			audience,
			published_at: form.publish
				? (editing?.published_at ?? new Date().toISOString())
				: null,
		};
		if (editing) {
			const { error } = await supabase.from('announcements').update(payload).eq('id', editing.id);
			if (error) {
				toast.error('Opslaan mislukt', { description: error.message });
			} else {
				toast.success('Bericht bijgewerkt');
				setDialogOpen(false);
				await refetch();
			}
		} else {
			const { error } = await supabase.from('announcements').insert(payload);
			if (error) {
				toast.error('Aanmaken mislukt', { description: error.message });
			} else {
				toast.success('Bericht aangemaakt');
				setDialogOpen(false);
				await refetch();
			}
		}
		setSaving(false);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id);
		if (error) {
			toast.error('Verwijderen mislukt', { description: error.message });
		} else {
			toast.success('Bericht verwijderd');
		}
		setDeleteTarget(null);
		await refetch();
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0">
				<div className="space-y-1">
					<CardTitle className="flex items-center gap-2">
						<LuMegaphone className="h-5 w-5" />
						Nieuwsberichten
					</CardTitle>
					<CardDescription>
						Plaats berichten die getoond worden op het dashboard van docenten en/of leerlingen.
					</CardDescription>
				</div>
				<Button onClick={openCreate} size="sm">
					<LuPlus className="mr-2 h-4 w-4" />
					Nieuw bericht
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className="text-sm text-muted-foreground">Laden...</p>
				) : announcements.length === 0 ? (
					<p className="text-sm text-muted-foreground">Er zijn nog geen nieuwsberichten.</p>
				) : (
					<ul className="divide-y divide-border">
						{announcements.map((a) => (
							<li key={a.id} className="flex items-center justify-between gap-3 py-3">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate font-medium">{a.title}</p>
										{a.published_at === null && (
											<Badge variant="outline" className="shrink-0">
												Concept
											</Badge>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										{audienceLabel(a.audience)}
										{a.published_at && (
											<>
												{' · '}
												Gepubliceerd op {formatDbDateToUi(a.published_at.slice(0, 10))}
											</>
										)}
									</p>
								</div>
								<div className="flex shrink-0 gap-1">
									<Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label="Bewerken">
										<LuPencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="text-destructive hover:text-destructive"
										onClick={() => setDeleteTarget(a)}
										aria-label="Verwijderen"
									>
										<LuTrash2 className="h-4 w-4" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editing ? 'Bericht bewerken' : 'Nieuw nieuwsbericht'}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="ann-title">Titel</Label>
							<Input
								id="ann-title"
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								maxLength={200}
								placeholder="Bijv. Zomersluiting 2026"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="ann-body">Bericht (Markdown)</Label>
								<div className="flex gap-1">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleInsertLink}
										disabled={uploading}
									>
										<LuLink className="mr-1 h-3.5 w-3.5" />
										Link
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handlePickImage}
										disabled={uploading}
									>
										<LuImage className="mr-1 h-3.5 w-3.5" />
										{uploading ? 'Uploaden...' : 'Afbeelding'}
									</Button>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleImageUpload}
									/>
								</div>
							</div>
							<Textarea
								id="ann-body"
								ref={bodyRef}
								value={form.body}
								onChange={(e) => setForm({ ...form, body: e.target.value })}
								rows={8}
								placeholder="Schrijf hier het bericht. Gebruik **vet**, *cursief*, [link](url) of voeg een afbeelding toe."
							/>
							{form.body.trim().length > 0 && (
								<div className="rounded-md border border-border bg-muted/30 p-3">
									<p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
										Voorvertoning
									</p>
									{renderMarkdown(form.body)}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label>Doelgroep</Label>
							<div className="flex flex-wrap gap-4">
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={form.audienceTeachers}
										onChange={(e) => setForm({ ...form, audienceTeachers: e.target.checked })}
									/>
									Docenten
								</label>
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={form.audienceStudents}
										onChange={(e) => setForm({ ...form, audienceStudents: e.target.checked })}
									/>
									Leerlingen
								</label>
							</div>
							{audience.length === 0 && (
								<p className="text-xs text-destructive">Selecteer ten minste één doelgroep.</p>
							)}
						</div>

						<div className="space-y-2">
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={form.publish}
									onChange={(e) => setForm({ ...form, publish: e.target.checked })}
								/>
								Direct publiceren (zichtbaar op dashboards)
							</label>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Annuleren
						</Button>
						<SubmitButton onClick={handleSave} loading={saving} disabled={!isFormValid}>
							{editing ? 'Opslaan' : 'Aanmaken'}
						</SubmitButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDeleteDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				onConfirm={handleDelete}
				title="Nieuwsbericht verwijderen"
				description={`Weet je zeker dat je "${deleteTarget?.title}" wilt verwijderen?`}
			/>
		</Card>
	);
}
