import { type FormEvent, useEffect, useState } from 'react';
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

export function ScheduleTrialLessonDialog({ open, onOpenChange, signupRequest, onScheduled }: Props) {
	const [teachers, setTeachers] = useState<TeacherOption[]>([]);
	const [teacherUserId, setTeacherUserId] = useState<string>('');
	const [date, setDate] = useState('');
	const [time, setTime] = useState('15:00');
	const [duration, setDuration] = useState(30);
	const [notes, setNotes] = useState('');
	const [studentEmail, setStudentEmail] = useState('');
	const [studentFirstName, setStudentFirstName] = useState('');
	const [studentLastName, setStudentLastName] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;
		setStudentEmail(signupRequest?.email ?? '');
		setStudentFirstName(signupRequest?.first_name ?? '');
		setStudentLastName(signupRequest?.last_name ?? '');
		setDate('');
		setTime('15:00');
		setDuration(30);
		setNotes('');
		setTeacherUserId('');
		(async () => {
			const lessonTypeId = signupRequest?.lesson_type_id;
			if (lessonTypeId) {
				const { data: tlt } = await supabase
					.from('teacher_lesson_types')
					.select('teacher_user_id')
					.eq('lesson_type_id', lessonTypeId);
				const ids = (tlt ?? []).map((r) => r.teacher_user_id);
				if (ids.length === 0) {
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
			} else {
				const { data: ts } = await supabase.from('teachers').select('user_id').eq('is_active', true);
				const ids = (ts ?? []).map((t) => t.user_id);
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
			}
		})();
	}, [open, signupRequest]);

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
					<div className="grid grid-cols-3 gap-3">
						<div>
							<Label>Datum</Label>
							<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
						</div>
						<div>
							<Label>Starttijd</Label>
							<Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
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
