import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { LuLoader, LuUser } from 'react-icons/lu';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
	type AvailabilitySlot,
	type ExistingAgreementForSlot,
	type ExistingTrialLessonForSlot,
	type FreeSlotForTeacher,
	getFreeSlotsAcrossTeachers,
} from '@/lib/agreementSlots';

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

interface TeacherInfo {
	userId: string;
	firstName: string | null;
	lastName: string | null;
	avatarUrl: string | null;
}

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function todayPlus(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function formatDateHeader(dateStr: string): string {
	const d = new Date(`${dateStr}T12:00:00`);
	return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${d.toLocaleString('nl-NL', { month: 'long' })}`;
}

function teacherName(t: TeacherInfo | undefined): string {
	if (!t) return 'Onbekende docent';
	return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || 'Docent';
}

function teacherInitials(t: TeacherInfo | undefined): string {
	if (!t) return '?';
	return `${(t.firstName ?? '?')[0] ?? '?'}${(t.lastName ?? '')[0] ?? ''}`.toUpperCase();
}

export function ScheduleTrialLessonDialog({ open, onOpenChange, signupRequest, onScheduled }: Props) {
	const [fromDate, setFromDate] = useState(todayPlus(1));
	const [toDate, setToDate] = useState(todayPlus(30));
	const [duration, setDuration] = useState(30);
	const [notes, setNotes] = useState('');
	const [studentEmail, setStudentEmail] = useState('');
	const [studentFirstName, setStudentFirstName] = useState('');
	const [studentLastName, setStudentLastName] = useState('');

	const [teachers, setTeachers] = useState<Map<string, TeacherInfo>>(new Map());
	const [availabilityByTeacher, setAvailabilityByTeacher] = useState<Map<string, AvailabilitySlot[]>>(new Map());
	const [agreementsByTeacher, setAgreementsByTeacher] = useState<Map<string, ExistingAgreementForSlot[]>>(new Map());
	const [trialsByTeacher, setTrialsByTeacher] = useState<Map<string, ExistingTrialLessonForSlot[]>>(new Map());

	const [selected, setSelected] = useState<FreeSlotForTeacher | null>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;
		setStudentEmail(signupRequest?.email ?? '');
		setStudentFirstName(signupRequest?.first_name ?? '');
		setStudentLastName(signupRequest?.last_name ?? '');
		setNotes('');
		setSelected(null);
		setFromDate(todayPlus(1));
		setToDate(todayPlus(30));
		setDuration(30);
	}, [open, signupRequest]);

	useEffect(() => {
		if (!open) return;
		const lessonTypeId = signupRequest?.lesson_type_id ?? null;
		setLoading(true);
		(async () => {
			let teacherIds: string[] = [];
			if (lessonTypeId) {
				const { data: tlt } = await supabase
					.from('teacher_lesson_types')
					.select('teacher_user_id')
					.eq('lesson_type_id', lessonTypeId);
				teacherIds = (tlt ?? []).map((r) => r.teacher_user_id);
			} else {
				const { data: ts } = await supabase.from('teachers').select('user_id').eq('is_active', true);
				teacherIds = (ts ?? []).map((t) => t.user_id);
			}

			if (teacherIds.length === 0) {
				setTeachers(new Map());
				setAvailabilityByTeacher(new Map());
				setAgreementsByTeacher(new Map());
				setTrialsByTeacher(new Map());
				setLoading(false);
				return;
			}

			const [profsRes, availRes, agreementsRes, trialsRes] = await Promise.all([
				supabase
					.from('profiles')
					.select('user_id, first_name, last_name, avatar_url')
					.in('user_id', teacherIds),
				supabase
					.from('teacher_availability')
					.select('teacher_user_id, day_of_week, start_time, end_time')
					.in('teacher_user_id', teacherIds),
				supabase
					.from('lesson_agreements')
					.select(
						'teacher_user_id, day_of_week, start_time, start_date, end_date, duration_minutes, frequency',
					)
					.in('teacher_user_id', teacherIds)
					.lte('start_date', toDate),
				supabase
					.from('trial_lessons')
					.select('teacher_user_id, scheduled_date, scheduled_start_time, duration_minutes, status')
					.in('teacher_user_id', teacherIds)
					.gte('scheduled_date', fromDate)
					.lte('scheduled_date', toDate),
			]);

			const teachersMap = new Map<string, TeacherInfo>();
			for (const p of profsRes.data ?? []) {
				teachersMap.set(p.user_id, {
					userId: p.user_id,
					firstName: p.first_name ?? null,
					lastName: p.last_name ?? null,
					avatarUrl: p.avatar_url ?? null,
				});
			}
			setTeachers(teachersMap);

			const availMap = new Map<string, AvailabilitySlot[]>();
			for (const a of availRes.data ?? []) {
				const arr = availMap.get(a.teacher_user_id) ?? [];
				arr.push({ day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time });
				availMap.set(a.teacher_user_id, arr);
			}
			setAvailabilityByTeacher(availMap);

			const agreementMap = new Map<string, ExistingAgreementForSlot[]>();
			for (const a of agreementsRes.data ?? []) {
				if (a.end_date !== null && a.end_date < fromDate) continue;
				const arr = agreementMap.get(a.teacher_user_id) ?? [];
				arr.push({
					day_of_week: a.day_of_week,
					start_time: a.start_time,
					start_date: a.start_date,
					end_date: a.end_date,
					duration_minutes: a.duration_minutes,
					frequency: a.frequency,
				});
				agreementMap.set(a.teacher_user_id, arr);
			}
			setAgreementsByTeacher(agreementMap);

			const trialMap = new Map<string, ExistingTrialLessonForSlot[]>();
			for (const t of trialsRes.data ?? []) {
				if (t.status === 'cancelled') continue;
				const arr = trialMap.get(t.teacher_user_id) ?? [];
				arr.push({
					teacher_user_id: t.teacher_user_id,
					scheduled_date: t.scheduled_date,
					scheduled_start_time: t.scheduled_start_time,
					duration_minutes: t.duration_minutes,
				});
				trialMap.set(t.teacher_user_id, arr);
			}
			setTrialsByTeacher(trialMap);

			setSelected(null);
			setLoading(false);
		})();
	}, [open, signupRequest, fromDate, toDate]);

	const freeSlots = useMemo<FreeSlotForTeacher[]>(() => {
		if (!fromDate || !toDate || availabilityByTeacher.size === 0) return [];
		const start = new Date(`${fromDate}T12:00:00`);
		const end = new Date(`${toDate}T12:00:00`);
		if (end < start) return [];
		return getFreeSlotsAcrossTeachers(
			start,
			end,
			availabilityByTeacher,
			agreementsByTeacher,
			trialsByTeacher,
			duration,
		);
	}, [fromDate, toDate, duration, availabilityByTeacher, agreementsByTeacher, trialsByTeacher]);

	const groupedByDate = useMemo(() => {
		const map = new Map<string, FreeSlotForTeacher[]>();
		for (const s of freeSlots) {
			const arr = map.get(s.date) ?? [];
			arr.push(s);
			map.set(s.date, arr);
		}
		return map;
	}, [freeSlots]);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (!selected) {
			toast.error('Selecteer een tijdslot');
			return;
		}
		setSubmitting(true);
		const { data, error } = await supabase.functions.invoke('schedule-trial-lesson', {
			body: {
				signup_request_id: signupRequest?.id ?? null,
				teacher_user_id: selected.teacher_user_id,
				lesson_type_id: signupRequest?.lesson_type_id ?? null,
				lesson_type_option_id: signupRequest?.lesson_type_option_id ?? null,
				scheduled_date: selected.date,
				scheduled_start_time: selected.start_time,
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
							? `Voor ${signupRequest.first_name} ${signupRequest.last_name} — kies een vrij tijdslot.`
							: 'Kies een vrij tijdslot binnen de periode.'}
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

					<div className="grid grid-cols-3 gap-3">
						<div>
							<Label>Van</Label>
							<Input
								type="date"
								value={fromDate}
								onChange={(e) => setFromDate(e.target.value)}
								required
							/>
						</div>
						<div>
							<Label>Tot</Label>
							<Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
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
						<Label>Beschikbare tijdsloten</Label>
						<div className="rounded-md border">
							<ScrollArea className="h-72">
								{loading ? (
									<div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
										<LuLoader className="h-4 w-4 animate-spin" />
										Slots laden…
									</div>
								) : groupedByDate.size === 0 ? (
									<div className="p-6 text-center text-sm text-muted-foreground">
										Geen vrije tijdsloten in deze periode.
									</div>
								) : (
									<div className="divide-y">
										{Array.from(groupedByDate.entries()).map(([date, slots]) => (
											<div key={date}>
												<div className="sticky top-0 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
													{formatDateHeader(date)}
												</div>
												<ul className="divide-y">
													{slots.map((slot) => {
														const t = teachers.get(slot.teacher_user_id);
														const isSelected =
															selected?.date === slot.date &&
															selected?.start_time === slot.start_time &&
															selected?.teacher_user_id === slot.teacher_user_id;
														return (
															<li
																key={`${slot.date}-${slot.start_time}-${slot.teacher_user_id}`}
															>
																<button
																	type="button"
																	onClick={() => setSelected(slot)}
																	className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
																		isSelected ? 'bg-accent' : ''
																	}`}
																>
																	<span className="w-24 font-mono tabular-nums">
																		{slot.start_time.slice(0, 5)}–
																		{slot.end_time.slice(0, 5)}
																	</span>
																	<Avatar className="h-6 w-6">
																		{t?.avatarUrl ? (
																			<AvatarImage
																				src={t.avatarUrl}
																				alt={teacherName(t)}
																			/>
																		) : null}
																		<AvatarFallback className="text-[10px]">
																			{t ? (
																				teacherInitials(t)
																			) : (
																				<LuUser className="h-3 w-3" />
																			)}
																		</AvatarFallback>
																	</Avatar>
																	<span className="truncate">{teacherName(t)}</span>
																</button>
															</li>
														);
													})}
												</ul>
											</div>
										))}
									</div>
								)}
							</ScrollArea>
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
						<Button type="submit" disabled={submitting || !selected}>
							{submitting ? 'Inplannen…' : 'Proefles inplannen'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
