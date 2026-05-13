import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TeacherSlotStepContent } from '@/components/agreements/TeacherSlotStepContent';
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
import { supabase } from '@/integrations/supabase/client';
import { getSlotStatuses, type SlotWithStatus } from '@/lib/agreementSlots';
import type { WizardTeacherInfo } from '@/types/lesson-agreements';

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

export function ScheduleTrialLessonDialog({ open, onOpenChange, signupRequest, onScheduled }: Props) {
	const [teachers, setTeachers] = useState<WizardTeacherInfo[]>([]);
	const [teacherUserId, setTeacherUserId] = useState<string | null>(null);
	const [date, setDate] = useState('');
	const [duration, setDuration] = useState(30);
	const [selectedSlot, setSelectedSlot] = useState<SlotWithStatus | null>(null);
	const [notes, setNotes] = useState('');
	const [studentEmail, setStudentEmail] = useState('');
	const [studentFirstName, setStudentFirstName] = useState('');
	const [studentLastName, setStudentLastName] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [availability, setAvailability] = useState<
		Array<{ day_of_week: number; start_time: string; end_time: string }>
	>([]);
	const [existingAgreements, setExistingAgreements] = useState<
		Array<{
			day_of_week: number;
			start_time: string;
			start_date: string;
			end_date: string | null;
			frequency: 'weekly' | 'biweekly' | 'monthly' | 'daily';
			duration_minutes: number;
		}>
	>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);

	useEffect(() => {
		if (!open) return;
		setStudentEmail(signupRequest?.email ?? '');
		setStudentFirstName(signupRequest?.first_name ?? '');
		setStudentLastName(signupRequest?.last_name ?? '');
		setDate('');
		setDuration(30);
		setNotes('');
		setTeacherUserId(null);
		setSelectedSlot(null);
		setAvailability([]);
		setExistingAgreements([]);
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
				.select('user_id, first_name, last_name, email, avatar_url')
				.in('user_id', ids);
			setTeachers(
				(profs ?? []).map((p) => ({
					id: p.user_id,
					userId: p.user_id,
					firstName: p.first_name ?? null,
					lastName: p.last_name ?? null,
					email: p.email ?? null,
					avatarUrl: p.avatar_url ?? null,
				})),
			);
		})();
	}, [open, signupRequest]);

	// Load availability + existing agreements when teacher and date selected
	useEffect(() => {
		if (!teacherUserId || !date) {
			setAvailability([]);
			setExistingAgreements([]);
			setSelectedSlot(null);
			return;
		}
		(async () => {
			setLoadingSlots(true);
			const [avail, agreements] = await Promise.all([
				supabase
					.from('teacher_availability')
					.select('day_of_week, start_time, end_time')
					.eq('teacher_user_id', teacherUserId),
				supabase
					.from('lesson_agreements')
					.select('day_of_week, start_time, start_date, end_date, duration_minutes, frequency')
					.eq('teacher_user_id', teacherUserId)
					.lte('start_date', date),
			]);
			setAvailability(avail.data ?? []);
			setExistingAgreements(
				(agreements.data ?? []).filter((a) => a.end_date === null || a.end_date >= date),
			);
			setSelectedSlot(null);
			setLoadingSlots(false);
		})();
	}, [teacherUserId, date]);

	const slotsWithStatus = useMemo<SlotWithStatus[]>(() => {
		if (!date || availability.length === 0) return [];
		const d = new Date(`${date}T12:00:00`);
		return getSlotStatuses(d, d, availability, existingAgreements, duration, 'weekly');
	}, [date, availability, existingAgreements, duration]);

	const selectedTeacher = useMemo(
		() => teachers.find((t) => t.userId === teacherUserId),
		[teachers, teacherUserId],
	);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (!teacherUserId || !date || !selectedSlot || !duration) {
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
				scheduled_start_time: selectedSlot.start_time,
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
			<DialogContent className="max-w-2xl">
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
					<TeacherSlotStepContent
						teachers={teachers}
						selectedTeacher={selectedTeacher}
						slotsWithStatus={slotsWithStatus}
						selectedSlot={selectedSlot}
						loadingStep3={loadingSlots}
						isTeacherOwnStudent={false}
						onTeacherChange={(userId) => setTeacherUserId(userId)}
						onSlotClick={(slot) => setSelectedSlot(slot)}
					/>
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
