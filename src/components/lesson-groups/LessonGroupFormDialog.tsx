import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import { UserSelectMultiple, UserSelectSingle } from '@/components/ui/user-select';
import { supabase } from '@/integrations/supabase/client';
import { LESSON_FREQUENCIES } from '@/lib/frequencies';
import type { LessonGroupRow } from '@/types/lesson-groups';

interface LessonTypeOption {
	id: string;
	name: string;
}

interface LessonGroupFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	group: LessonGroupRow | null;
	onSaved: () => void;
}

const DAYS_OF_WEEK = [
	{ value: 1, label: 'Maandag' },
	{ value: 2, label: 'Dinsdag' },
	{ value: 3, label: 'Woensdag' },
	{ value: 4, label: 'Donderdag' },
	{ value: 5, label: 'Vrijdag' },
	{ value: 6, label: 'Zaterdag' },
	{ value: 0, label: 'Zondag' },
];

export function LessonGroupFormDialog({ open, onOpenChange, group, onSaved }: LessonGroupFormDialogProps) {
	const [saving, setSaving] = useState(false);
	const [lessonTypes, setLessonTypes] = useState<LessonTypeOption[]>([]);
	const [name, setName] = useState('');
	const [lessonTypeId, setLessonTypeId] = useState<string>('');
	const [teacherUserId, setTeacherUserId] = useState<string | null>(null);
	const [durationMinutes, setDurationMinutes] = useState('60');
	const [frequency, setFrequency] = useState('weekly');
	const [pricePerLesson, setPricePerLesson] = useState('0');
	const [dayOfWeek, setDayOfWeek] = useState<number>(1);
	const [startTime, setStartTime] = useState('17:00');
	const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
	const [endDate, setEndDate] = useState<string>('');
	const [isActive, setIsActive] = useState(true);
	const [memberIds, setMemberIds] = useState<string[]>([]);

	useEffect(() => {
		if (!open) return;
		(async () => {
			const { data } = await supabase
				.from('lesson_types')
				.select('id, name')
				.eq('is_group_lesson', true)
				.eq('is_active', true)
				.order('name');
			setLessonTypes((data ?? []) as LessonTypeOption[]);
		})();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		if (group) {
			setName(group.name);
			setLessonTypeId(group.lesson_type_id);
			setTeacherUserId(group.teacher_user_id);
			setDurationMinutes(String(group.duration_minutes));
			setFrequency(group.frequency);
			setPricePerLesson(String(group.price_per_lesson));
			setDayOfWeek(group.day_of_week);
			setStartTime(group.start_time.slice(0, 5));
			setStartDate(group.start_date);
			setEndDate(group.end_date ?? '');
			setIsActive(group.is_active);
			(async () => {
				const { data } = await supabase
					.from('lesson_group_members')
					.select('student_user_id')
					.eq('lesson_group_id', group.id)
					.is('left_date', null);
				setMemberIds((data ?? []).map((r) => r.student_user_id));
			})();
		} else {
			setName('');
			setLessonTypeId('');
			setTeacherUserId(null);
			setDurationMinutes('60');
			setFrequency('weekly');
			setPricePerLesson('0');
			setDayOfWeek(1);
			setStartTime('17:00');
			setStartDate(new Date().toISOString().slice(0, 10));
			setEndDate('');
			setIsActive(true);
			setMemberIds([]);
		}
	}, [open, group]);

	const handleSave = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!name.trim() || !lessonTypeId || !teacherUserId) {
				toast.error('Vul naam, lestype en docent in');
				return;
			}
			setSaving(true);
			try {
				const payload = {
					name: name.trim(),
					lesson_type_id: lessonTypeId,
					teacher_user_id: teacherUserId,
					duration_minutes: Number(durationMinutes),
					frequency: frequency as LessonGroupRow['frequency'],
					price_per_lesson: Number(pricePerLesson),
					day_of_week: dayOfWeek,
					start_time: startTime,
					start_date: startDate,
					end_date: endDate || null,
					is_active: isActive,
				};

				let groupId: string;
				if (group) {
					const { error } = await supabase.from('lesson_groups').update(payload).eq('id', group.id);
					if (error) throw error;
					groupId = group.id;
				} else {
					const { data, error } = await supabase
						.from('lesson_groups')
						.insert(payload)
						.select('id')
						.single();
					if (error) throw error;
					groupId = data.id;
				}

				// Sync members
				const { data: existing } = await supabase
					.from('lesson_group_members')
					.select('id, student_user_id')
					.eq('lesson_group_id', groupId)
					.is('left_date', null);
				const existingIds = new Set((existing ?? []).map((m) => m.student_user_id));
				const newIds = new Set(memberIds);

				// Add
				for (const id of memberIds) {
					if (!existingIds.has(id)) {
						const { error } = await supabase
							.from('lesson_group_members')
							.insert({ lesson_group_id: groupId, student_user_id: id });
						if (error) throw error;
					}
				}
				// Remove (delete; could mark left_date instead later)
				for (const m of existing ?? []) {
					if (!newIds.has(m.student_user_id)) {
						await supabase.from('lesson_group_members').delete().eq('id', m.id);
					}
				}

				toast.success(group ? 'Lesgroep bijgewerkt' : 'Lesgroep aangemaakt');
				onSaved();
				onOpenChange(false);
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Onbekende fout';
				toast.error('Opslaan mislukt', { description: msg });
			} finally {
				setSaving(false);
			}
		},
		[
			name,
			lessonTypeId,
			teacherUserId,
			durationMinutes,
			frequency,
			pricePerLesson,
			dayOfWeek,
			startTime,
			startDate,
			endDate,
			isActive,
			memberIds,
			group,
			onSaved,
			onOpenChange,
		],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{group ? 'Lesgroep bewerken' : 'Nieuwe lesgroep'}</DialogTitle>
					<DialogDescription>
						Bundel leerlingen die samen een groepsles volgen. Deelnemers verschijnen automatisch in
						hun agenda zodra de groep ingepland is.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSave} className="grid gap-4 py-2">
					<div>
						<Label htmlFor="name">Naam</Label>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Lestype (groepsles)</Label>
							<Select value={lessonTypeId} onValueChange={setLessonTypeId}>
								<SelectTrigger>
									<SelectValue placeholder="Kies lestype" />
								</SelectTrigger>
								<SelectContent>
									{lessonTypes.map((lt) => (
										<SelectItem key={lt.id} value={lt.id}>
											{lt.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Docent</Label>
							<UserSelectSingle
								value={teacherUserId}
								onChange={(u) => setTeacherUserId(u?.user_id ?? null)}
								filter="teacher"
								placeholder="Kies docent"
							/>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-4">
						<div>
							<Label>Duur (min)</Label>
							<Input
								type="number"
								min={5}
								value={durationMinutes}
								onChange={(e) => setDurationMinutes(e.target.value)}
							/>
						</div>
						<div>
							<Label>Frequentie</Label>
							<Select value={frequency} onValueChange={setFrequency}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LESSON_FREQUENCIES.map((f) => (
										<SelectItem key={f.value} value={f.value}>
											{f.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Prijs per deelnemer (€)</Label>
							<Input
								type="number"
								step="0.01"
								min={0}
								value={pricePerLesson}
								onChange={(e) => setPricePerLesson(e.target.value)}
							/>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-4">
						<div>
							<Label>Dag</Label>
							<Select
								value={String(dayOfWeek)}
								onValueChange={(v) => setDayOfWeek(Number(v))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DAYS_OF_WEEK.map((d) => (
										<SelectItem key={d.value} value={String(d.value)}>
											{d.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Starttijd</Label>
							<Input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
							/>
						</div>
						<div>
							<Label>Status</Label>
							<Select
								value={isActive ? 'active' : 'inactive'}
								onValueChange={(v) => setIsActive(v === 'active')}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Actief</SelectItem>
									<SelectItem value="inactive">Inactief</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Startdatum</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div>
							<Label>Einddatum (optioneel)</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>
					<div>
						<Label>Deelnemers</Label>
						<UserSelectMultiple
							value={memberIds}
							onChange={(users) => setMemberIds(users.map((u) => u.user_id))}
							filter="students"
							placeholder="Voeg leerlingen toe..."
						/>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Annuleren
						</Button>
						<SubmitButton loading={saving}>{group ? 'Opslaan' : 'Aanmaken'}</SubmitButton>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
