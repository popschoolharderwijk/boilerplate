import { useCallback, useEffect, useState } from 'react';
import { LuCalendarOff, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { formatDbDateToUi } from '@/lib/date/date-format';

interface NoLessonPeriod {
	id: string;
	name: string;
	start_date: string;
	end_date: string;
	description: string | null;
}

interface FormState {
	name: string;
	start_date: string;
	end_date: string;
	description: string;
}

const EMPTY_FORM: FormState = { name: '', start_date: '', end_date: '', description: '' };

export function NoLessonPeriodsManager() {
	const [periods, setPeriods] = useState<NoLessonPeriod[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<NoLessonPeriod | null>(null);
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<NoLessonPeriod | null>(null);

	const fetchPeriods = useCallback(async () => {
		const { data, error } = await supabase
			.from('no_lesson_periods')
			.select('id, name, start_date, end_date, description')
			.order('start_date', { ascending: true });
		if (error) {
			toast.error('Fout bij laden lesvrije periodes');
		} else {
			setPeriods(data ?? []);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		fetchPeriods();
	}, [fetchPeriods]);

	const openCreate = () => {
		setEditing(null);
		setForm(EMPTY_FORM);
		setDialogOpen(true);
	};

	const openEdit = (period: NoLessonPeriod) => {
		setEditing(period);
		setForm({
			name: period.name,
			start_date: period.start_date,
			end_date: period.end_date,
			description: period.description ?? '',
		});
		setDialogOpen(true);
	};

	const isFormValid =
		form.name.trim().length > 0 &&
		form.start_date.length > 0 &&
		form.end_date.length > 0 &&
		form.end_date >= form.start_date;

	const handleSave = async () => {
		if (!isFormValid) return;
		setSaving(true);

		const payload = {
			name: form.name.trim(),
			start_date: form.start_date,
			end_date: form.end_date,
			description: form.description.trim() ? form.description.trim() : null,
		};

		if (editing) {
			const { error } = await supabase.from('no_lesson_periods').update(payload).eq('id', editing.id);
			if (error) {
				toast.error('Fout bij bijwerken lesvrije periode');
			} else {
				toast.success('Lesvrije periode bijgewerkt');
			}
		} else {
			const { error } = await supabase.from('no_lesson_periods').insert(payload);
			if (error) {
				toast.error('Fout bij aanmaken lesvrije periode');
			} else {
				toast.success('Lesvrije periode aangemaakt');
			}
		}

		setSaving(false);
		setDialogOpen(false);
		await fetchPeriods();
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		const { data, error } = await supabase
			.from('no_lesson_periods')
			.delete()
			.eq('id', deleteTarget.id)
			.select('id');
		if (error || !data?.length) {
			toast.error('Lesvrije periode niet verwijderd', {
				description: 'Geen rechten om deze periode te verwijderen.',
			});
		} else {
			toast.success('Lesvrije periode verwijderd');
		}
		setDeleteTarget(null);
		await fetchPeriods();
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0">
				<div className="space-y-1">
					<CardTitle className="flex items-center gap-2">
						<LuCalendarOff className="h-5 w-5" />
						Lesvrije periodes
					</CardTitle>
					<CardDescription>
						Tijdens deze periodes worden geen lessen ingepland (bijvoorbeeld vakanties).
					</CardDescription>
				</div>
				<Button onClick={openCreate} size="sm">
					<LuPlus className="mr-2 h-4 w-4" />
					Nieuwe periode
				</Button>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-muted-foreground">Laden...</p>
				) : periods.length === 0 ? (
					<p className="text-sm text-muted-foreground">Er zijn nog geen lesvrije periodes ingesteld.</p>
				) : (
					<ul className="divide-y divide-border">
						{periods.map((period) => (
							<li key={period.id} className="flex items-center justify-between gap-3 py-3">
								<div className="min-w-0 flex-1">
									<p className="font-medium truncate">{period.name}</p>
									<p className="text-sm text-muted-foreground">
										{formatDbDateToUi(period.start_date)} t/m {formatDbDateToUi(period.end_date)}
									</p>
									{period.description && (
										<p className="text-xs text-muted-foreground mt-0.5 truncate">
											{period.description}
										</p>
									)}
								</div>
								<div className="flex shrink-0 gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => openEdit(period)}
										aria-label="Bewerken"
									>
										<LuPencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="text-destructive hover:text-destructive"
										onClick={() => setDeleteTarget(period)}
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editing ? 'Periode bewerken' : 'Nieuwe lesvrije periode'}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="period-name">Naam</Label>
							<Input
								id="period-name"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								placeholder="Bijv. Kerstvakantie 2025"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="period-start">Startdatum</Label>
								<Input
									id="period-start"
									type="date"
									value={form.start_date}
									onChange={(e) => setForm({ ...form, start_date: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="period-end">Einddatum</Label>
								<Input
									id="period-end"
									type="date"
									value={form.end_date}
									onChange={(e) => setForm({ ...form, end_date: e.target.value })}
								/>
							</div>
						</div>
						{form.start_date && form.end_date && form.end_date < form.start_date && (
							<p className="text-xs text-destructive">Einddatum moet op of na startdatum liggen.</p>
						)}
						<div className="space-y-2">
							<Label htmlFor="period-description">Beschrijving (optioneel)</Label>
							<Textarea
								id="period-description"
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								rows={2}
							/>
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
				title="Lesvrije periode verwijderen"
				description={`Weet je zeker dat je "${deleteTarget?.name}" wilt verwijderen?`}
			/>
		</Card>
	);
}
