import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface SignupRequestPrefill {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	lesson_type_id: string;
	lesson_type_option_id: string | null;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	signupRequest?: SignupRequestPrefill | null;
	onScheduled?: () => void;
}

interface TeacherOption {
	user_id: string;
	display_name: string;
}

interface AvailabilitySlot {
	day_of_week: number;
	start_time: string; // HH:MM:SS
	end_time: string;
}

function toMinutes(t: string): number {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + m;
}

function fmt(min: number): string {
	const h = Math.floor(min / 60);
	const m = min % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Generate 15-minute interval slot starts that fit `duration` within an availability window. */
function generateSlots(slots: AvailabilitySlot[], dayOfWeek: number, duration: number): string[] {
	const result: string[] = [];
	for (const s of slots) {
		if (s.day_of_week !== dayOfWeek) continue;
		const start = toMinutes(s.start_time);
		const end = toMinutes(s.end_time);
		for (let t = start; t + duration <= end; t += 15) {
			result.push(fmt(t));
		}
	}
	return Array.from(new Set(result)).sort();
}

export function ScheduleTrialLessonDialog({ open, onOpenChange, signupRequest, onScheduled }: Props) {
	const [teachers, setTeachers] = useState<TeacherOption[]>([]);
	const [teacherUserId, setTeacherUserId] = useState<string>('');
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [duration, setDuration] = useState(30);
	const [notes, setNotes] = useState('');
	const [studentEmail, setStudentEmail] = useState('');
	const [studentFirstName, setStudentFirstName] = useState('');
	const [studentLastName, setStudentLastName] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

	useEffect(() => {
		if (!open) return;
		setStudentEmail(signupRequest?.email ?? '');
		setStudentFirstName(signupRequest?.first_name ?? '');
		setStudentLastName(signupRequest?.last_name ?? '');
		setDate('');
		setTime('');
		setDuration(30);
		setNotes('');
		setTeacherUserId('');
		setAvailability([]);
		(async () => {
			const lessonTypeId = signupRequest?.lesson_type_id;
			let ids: string[] = [];
			if (lessonTypeId) {
				const { data: tlt } = await supabase
					.from('teacher_lesson_types')
					.select('teacher_user_id')
					.eq('lesson_type_id', lessonTypeId);
				ids = (tlt ?? []).map((r) => r.teacher_user_id);
			} else {
				const { data: ts } = await supabase.from('teachers').select('user_id').eq('is_active', true);
				ids = (ts ?? []).map((t) => t.user_id);
			}
			if (!ids.length) {
				setTeachers([]);
				return;
			}
			const { data: profs } = await supabase
				.from('profiles')
				.select('user_id, first_name, last_name')
				.in('user_id', ids);
			setTeachers(
				(profs ?? []).map((p) => ({
					user_id: p.user_id,
					display_name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.user_id.slice(0, 8),
				})),
			);
		})();
	}, [open, signupRequest]);

	// Load availability when teacher changes
	useEffect(() => {
		if (!teacherUserId) {
			setAvailability([]);
			return;
		}
		(async () => {
			const { data } = await supabase
				.from('teacher_availability')
				.select('day_of_week, start_time, end_time')
				.eq('teacher_user_id', teacherUserId);
			setAvailability((data ?? []) as AvailabilitySlot[]);
			setTime('');
		})();
	}, [teacherUserId]);

	const slots = useMemo(() => {
		if (!date) return [];
		const d = new Date(`${date}T00:00:00`);
		// teacher_availability.day_of_week: 1=Mon..7=Sun (Postgres ISO). JS getDay: 0=Sun..6=Sat.
		const jsDay = d.getDay();
		const isoDay = jsDay === 0 ? 7 : jsDay;
		return generateSlots(availability, isoDay, duration);
	}, [availability, date, duration]);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (!teacherUserId || !date || !time || !duration) {
			toast.error('Vul alle velden in');
			return;
		}
		setSubmitting(true);
		const { data, error } = await supabase.functions.invoke('schedule-trial-lesson', {
			body: {
				signup_request_id: signupRequest?.id ?? null,
				teacher_user_id: teacherUserId,
				lesson_type_id: signupRequest?.lesson_type_id ?? null,
				lesson_type_option_id: signupRequest?.lesson_type_option_id ?? null,
				scheduled_date: date,
				scheduled_start_time: time,
				duration_minutes: duration,
				notes: notes || null,
				student_email: signupRequest ? undefined : studentEmail,
				student_first_name: signupRequest ? undefined : studentFirstName,
				student_last_name: signupRequest ? undefined : studentLastName,
			},
		});
		setSubmitting(false);
		if (error || (data as { error?: string })?.error) {
			toast.error((data as { error?: string })?.error ?? error?.message ?? 'Fout bij inplannen');
			return;
		}
		toast.success('Proefles ingepland');
		onOpenChange(false);
		onScheduled?.();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Proefles inplannen</DialogTitle>
					<DialogDescription>
						{signupRequest
							? `Voor ${signupRequest.first_name} ${signupRequest.last_name}`
							: 'Plan een nieuwe proefles in.'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-3">
					{!signupRequest && (
						<>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<Label>Voornaam</Label>
									<Input
										value={studentFirstName}
										onChange={(e) => setStudentFirstName(e.target.value)}
										required
									/>
								</div>
								<div>
									<Label>Achternaam</Label>
									<Input
										value={studentLastName}
										onChange={(e) => setStudentLastName(e.target.value)}
										required
									/>
								</div>
							</div>
							<div>
								<Label>E-mail</Label>
								<Input
									type="email"
									value={studentEmail}
									onChange={(e) => setStudentEmail(e.target.value)}
									required
								/>
							</div>
						</>
					)}
					<div>
						<Label>Docent</Label>
						<Select value={teacherUserId} onValueChange={setTeacherUserId}>
							<SelectTrigger>
								<SelectValue placeholder="Kies docent" />
							</SelectTrigger>
							<SelectContent>
								{teachers.map((t) => (
									<SelectItem key={t.user_id} value={t.user_id}>
										{t.display_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label>Datum</Label>
							<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
						</div>
						<div>
							<Label>Duur (min)</Label>
							<Input
								type="number"
								min={15}
								step={15}
								value={duration}
								onChange={(e) => setDuration(Number(e.target.value))}
								required
							/>
						</div>
					</div>
					<div>
						<Label>Starttijd</Label>
						{teacherUserId && date ? (
							slots.length > 0 ? (
								<Select value={time} onValueChange={setTime}>
									<SelectTrigger>
										<SelectValue placeholder="Kies een beschikbaar tijdslot" />
									</SelectTrigger>
									<SelectContent>
										{slots.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<>
									<p className="text-xs text-muted-foreground mb-1">
										Geen beschikbaarheid voor deze dag — kies handmatig een tijd.
									</p>
									<Input
										type="time"
										value={time}
										onChange={(e) => setTime(e.target.value)}
										required
									/>
								</>
							)
						) : (
							<Input
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								disabled
								placeholder="Kies eerst docent en datum"
							/>
						)}
					</div>
					<div>
						<Label>Notitie</Label>
						<Input value={notes} onChange={(e) => setNotes(e.target.value)} />
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Annuleren
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting ? 'Inplannen…' : 'Proefles inplannen'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
