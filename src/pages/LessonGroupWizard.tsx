import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuCalendarClock, LuCircleCheck, LuClipboardCheck, LuMusic2, LuTriangleAlert, LuUsers } from 'react-icons/lu';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { TeacherSlotStepContent } from '@/components/agreements/TeacherSlotStepContent';
import { type WizardStepDef, WizardStepIndicator } from '@/components/agreements/WizardStepIndicator';
import { NavPageHeaderIcon } from '@/components/layout/NavPageHeaderIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LessonTypeBadge } from '@/components/ui/lesson-type-badge';
import { LessonTypeSelect } from '@/components/ui/lesson-type-select';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import { UserDisplay } from '@/components/ui/user-display';
import { UserSelectMultiple } from '@/components/ui/user-select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getSlotStatuses, type SlotWithStatus } from '@/lib/agreementSlots';
import {
	addDaysFromNow,
	addDaysToDateStr,
	addYearsFromNow,
	formatDateToDb,
	formatDbDateToUi,
} from '@/lib/date/date-format';
import { DAY_NAMES } from '@/lib/date/day-index';
import { frequencyLabels, frequencyOptions } from '@/lib/frequencies';
import { formatTime } from '@/lib/time/time-format';
import type { LessonFrequency } from '@/types/lesson-agreements';

// ===================== Step config =====================

enum LGStep {
	Basics = 'basics',
	Teacher = 'teacher',
	Members = 'members',
	Confirm = 'confirm',
}

const LG_STEP_ORDER: LGStep[] = [LGStep.Basics, LGStep.Teacher, LGStep.Members, LGStep.Confirm];

const LG_STEPS: WizardStepDef<LGStep>[] = [
	{ key: LGStep.Basics, label: 'Groep & lessoort', icon: LuMusic2 },
	{ key: LGStep.Teacher, label: 'Docent & tijdslot', icon: LuCalendarClock },
	{ key: LGStep.Members, label: 'Leerlingen', icon: LuUsers },
	{ key: LGStep.Confirm, label: 'Overzicht', icon: LuClipboardCheck },
];

interface LessonTypeOpt {
	id: string;
	name: string;
	icon: string;
	color: string;
}

interface TeacherOpt {
	id: string;
	userId: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	avatarUrl: string | null;
}

// ===================== Helpers =====================

function tomorrowStr(): string {
	return formatDateToDb(addDaysFromNow(1));
}
function oneYearStr(): string {
	return formatDateToDb(addYearsFromNow(1));
}

// ===================== Component =====================

export default function LessonGroupWizard() {
	const { id } = useParams<{ id: string }>();
	const isEditMode = id !== undefined && id !== 'new';
	const navigate = useNavigate();
	const { isAdmin, isSiteAdmin, isPrivileged, isLoading: authLoading } = useAuth();
	const canEdit = isAdmin || isSiteAdmin || isPrivileged;

	// ----- form state -----
	const [step, setStep] = useState<LGStep>(LGStep.Basics);
	const [highestStep, setHighestStep] = useState(0);
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(isEditMode);

	const [name, setName] = useState('');
	const [lessonTypeId, setLessonTypeId] = useState<string | null>(null);
	const [durationMinutes, setDurationMinutes] = useState(60);
	const [frequency, setFrequency] = useState<LessonFrequency>('weekly');
	const [pricePerLesson, setPricePerLesson] = useState(0);
	const [startDate, setStartDate] = useState(tomorrowStr());
	const [endDate, setEndDate] = useState(oneYearStr());

	const [teacherUserId, setTeacherUserId] = useState<string | null>(null);
	const [slot, setSlot] = useState<SlotWithStatus | null>(null);
	const [partialOpen, setPartialOpen] = useState(false);

	const [memberIds, setMemberIds] = useState<string[]>([]);
	const [eligibleStudentIds, setEligibleStudentIds] = useState<string[]>([]);
	const [scheduleInAgenda, setScheduleInAgenda] = useState(true);

	// ----- reference data -----
	const [lessonTypes, setLessonTypes] = useState<LessonTypeOpt[]>([]);
	const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
	const [slots, setSlots] = useState<SlotWithStatus[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);

	// load lesson types (group lessons only)
	useEffect(() => {
		supabase
			.from('lesson_types')
			.select('id, name, icon, color')
			.eq('is_active', true)
			.eq('is_group_lesson', true)
			.order('name')
			.then(({ data }) => setLessonTypes(data ?? []));
	}, []);

	// load existing group when editing
	useEffect(() => {
		if (!isEditMode || !id) {
			setLoading(false);
			return;
		}
		(async () => {
			const { data, error } = await supabase.from('lesson_groups').select('*').eq('id', id).single();
			if (error || !data) {
				toast.error('Lesgroep niet gevonden');
				navigate('/lesson-groups');
				return;
			}
			setName(data.name);
			setLessonTypeId(data.lesson_type_id);
			setDurationMinutes(data.duration_minutes);
			setFrequency(data.frequency as LessonFrequency);
			setPricePerLesson(Number(data.price_per_lesson));
			setStartDate(data.start_date);
			setEndDate(data.end_date ?? oneYearStr());
			setTeacherUserId(data.teacher_user_id);
			setSlot({
				day_of_week: data.day_of_week,
				start_time: data.start_time,
				end_time: data.start_time,
				status: 'free',
				occupiedOccurrences: 0,
				totalOccurrences: 0,
			});
			const { data: members } = await supabase
				.from('lesson_group_members')
				.select('student_user_id')
				.eq('lesson_group_id', id)
				.is('left_date', null);
			setMemberIds((members ?? []).map((m) => m.student_user_id));
			setHighestStep(LG_STEP_ORDER.length - 1);
			setStep(LGStep.Confirm);
			setScheduleInAgenda(false);
			setLoading(false);
		})();
	}, [id, isEditMode, navigate]);

	// load teachers offering this lesson type
	useEffect(() => {
		if (!lessonTypeId) {
			setTeachers([]);
			return;
		}
		(async () => {
			const { data: tlt } = await supabase
				.from('teacher_lesson_types')
				.select('teacher_user_id')
				.eq('lesson_type_id', lessonTypeId);
			const ids = (tlt ?? []).map((r) => r.teacher_user_id);
			if (!ids.length) {
				setTeachers([]);
				return;
			}
			const [{ data: actives }, { data: profiles }] = await Promise.all([
				supabase.from('teachers').select('user_id').in('user_id', ids).eq('is_active', true),
				supabase
					.from('profiles')
					.select('user_id, first_name, last_name, email, avatar_url')
					.in('user_id', ids),
			]);
			const profMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
			setTeachers(
				(actives ?? []).map((t) => {
					const p = profMap.get(t.user_id);
					return {
						id: t.user_id,
						userId: t.user_id,
						firstName: p?.first_name ?? null,
						lastName: p?.last_name ?? null,
						email: p?.email ?? null,
						avatarUrl: p?.avatar_url ?? null,
					};
				}),
			);
		})();
	}, [lessonTypeId]);

	// load students who signed up for this lesson type (have an agreement of this type)
	useEffect(() => {
		if (!lessonTypeId) {
			setEligibleStudentIds([]);
			return;
		}
		(async () => {
			const { data } = await supabase
				.from('lesson_agreements')
				.select('student_user_id')
				.eq('lesson_type_id', lessonTypeId);
			const ids = Array.from(new Set((data ?? []).map((a) => a.student_user_id)));
			setEligibleStudentIds(ids);
		})();
	}, [lessonTypeId]);

	// compute slot statuses for chosen teacher (visualises agenda)
	useEffect(() => {
		if (step !== LGStep.Teacher || !teacherUserId || !startDate || !endDate) {
			setSlots([]);
			return;
		}
		(async () => {
			setLoadingSlots(true);
			const [avail, agreements, groups] = await Promise.all([
				supabase
					.from('teacher_availability')
					.select('day_of_week, start_time, end_time')
					.eq('teacher_user_id', teacherUserId),
				supabase
					.from('lesson_agreements')
					.select('day_of_week, start_time, start_date, end_date, duration_minutes, frequency')
					.eq('teacher_user_id', teacherUserId)
					.lte('start_date', endDate),
				supabase
					.from('lesson_groups')
					.select('id, day_of_week, start_time, start_date, end_date, duration_minutes, frequency')
					.eq('teacher_user_id', teacherUserId)
					.lte('start_date', endDate),
			]);
			const existing = [
				...(agreements.data ?? []).filter(
					(a) => a.start_date <= endDate && (a.end_date === null || a.end_date >= startDate),
				),
				...(groups.data ?? [])
					.filter((g) => (isEditMode ? g.id !== id : true))
					.filter((g) => g.start_date <= endDate && (g.end_date === null || g.end_date >= startDate))
					.map((g) => ({
						day_of_week: g.day_of_week,
						start_time: g.start_time,
						start_date: g.start_date,
						end_date: g.end_date,
						duration_minutes: g.duration_minutes,
						frequency: g.frequency as LessonFrequency,
					})),
			];
			const statuses = getSlotStatuses(
				new Date(startDate),
				new Date(endDate),
				avail.data ?? [],
				existing.map((e) => ({
					day_of_week: e.day_of_week,
					start_time: e.start_time,
					start_date: e.start_date,
					end_date: e.end_date,
					duration_minutes: e.duration_minutes,
					frequency: e.frequency as LessonFrequency,
				})),
				durationMinutes,
				frequency,
			);
			setSlots(statuses);
			setLoadingSlots(false);
		})();
	}, [step, teacherUserId, startDate, endDate, durationMinutes, frequency, id, isEditMode]);

	// ----- derived -----
	const selectedLessonType = useMemo(
		() => lessonTypes.find((lt) => lt.id === lessonTypeId),
		[lessonTypes, lessonTypeId],
	);
	const selectedTeacher = useMemo(() => teachers.find((t) => t.userId === teacherUserId), [teachers, teacherUserId]);

	const stepIndex = LG_STEP_ORDER.indexOf(step);
	const isFirst = stepIndex === 0;
	const isLast = stepIndex === LG_STEP_ORDER.length - 1;

	const canProceed = useCallback(
		(s: LGStep): boolean => {
			switch (s) {
				case LGStep.Basics:
					return Boolean(
						name.trim() &&
							lessonTypeId &&
							durationMinutes > 0 &&
							pricePerLesson >= 0 &&
							startDate &&
							endDate &&
							new Date(endDate) >= new Date(startDate),
					);
				case LGStep.Teacher:
					return Boolean(teacherUserId && slot && slot.status !== 'occupied');
				case LGStep.Members:
					return true; // members optional
				case LGStep.Confirm:
					return true;
			}
		},
		[name, lessonTypeId, durationMinutes, pricePerLesson, startDate, endDate, teacherUserId, slot],
	);

	const goNext = () => {
		if (isLast) return;
		const next = stepIndex + 1;
		setStep(LG_STEP_ORDER[next]);
		if (next > highestStep) setHighestStep(next);
	};
	const goPrev = () => !isFirst && setStep(LG_STEP_ORDER[stepIndex - 1]);

	// ----- save -----
	const handleSave = async () => {
		if (!name.trim() || !lessonTypeId || !teacherUserId || !slot) {
			toast.error('Vul alle verplichte velden in');
			return;
		}
		setSaving(true);
		try {
			const startTime = slot.start_time.includes(':') ? slot.start_time : slot.start_time + ':00';
			const payload = {
				name: name.trim(),
				lesson_type_id: lessonTypeId,
				teacher_user_id: teacherUserId,
				duration_minutes: durationMinutes,
				frequency,
				price_per_lesson: pricePerLesson,
				day_of_week: slot.day_of_week,
				start_time: startTime,
				start_date: startDate,
				end_date: endDate || null,
				is_active: true,
			};

			let groupId: string;
			if (isEditMode && id) {
				const { error } = await supabase.from('lesson_groups').update(payload).eq('id', id);
				if (error) throw error;
				groupId = id;
			} else {
				const { data, error } = await supabase.from('lesson_groups').insert(payload).select('id').single();
				if (error) throw error;
				groupId = data.id;
			}

			// Sync members
			const { data: existing } = await supabase
				.from('lesson_group_members')
				.select('id, student_user_id')
				.eq('lesson_group_id', groupId)
				.is('left_date', null);
			const existingMap = new Map((existing ?? []).map((m) => [m.student_user_id, m.id]));
			const wanted = new Set(memberIds);

			const toAdd = memberIds.filter((m) => !existingMap.has(m));
			if (toAdd.length) {
				const { error } = await supabase
					.from('lesson_group_members')
					.insert(toAdd.map((sid) => ({ lesson_group_id: groupId, student_user_id: sid })));
				if (error) throw error;
			}
			for (const m of existing ?? []) {
				if (!wanted.has(m.student_user_id)) {
					await supabase.from('lesson_group_members').delete().eq('id', m.id);
				}
			}

			// Schedule into agenda (only on create + opt-in)
			if (!isEditMode && scheduleInAgenda) {
				const start = new Date(startDate + 'T12:00:00');
				const offset = (slot.day_of_week - start.getDay() + 7) % 7;
				const firstDateStr = addDaysToDateStr(startDate, offset);
				const [h, m] = startTime.split(':').map(Number);
				const total = h * 60 + (m ?? 0) + durationMinutes;
				const eh = Math.floor(total / 60) % 24;
				const em = total % 60;
				const endTimeStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
				const { error } = await supabase.from('agenda_events').insert({
					source_type: 'lesson_group',
					source_id: groupId,
					owner_user_id: teacherUserId,
					title: name.trim(),
					start_date: firstDateStr,
					start_time: startTime,
					end_date: firstDateStr,
					end_time: endTimeStr,
					is_all_day: false,
					recurring: true,
					recurring_frequency: frequency,
					recurring_end_date: endDate || null,
				});
				if (error) {
					toast.error('Lesgroep opgeslagen, maar inplannen mislukt', { description: error.message });
				}
			}

			toast.success(isEditMode ? 'Lesgroep bijgewerkt' : 'Lesgroep aangemaakt');
			navigate('/lesson-groups');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Onbekende fout';
			toast.error('Opslaan mislukt', { description: msg });
		} finally {
			setSaving(false);
		}
	};

	if (authLoading || loading) {
		return <div className="flex items-center justify-center p-8 text-muted-foreground">Laden...</div>;
	}
	if (!canEdit) return <Navigate to="/lesson-groups" replace />;

	return (
		<>
			<div className="mb-6">
				<PageHeader
					icon={<NavPageHeaderIcon name="lessonGroups" />}
					title={isEditMode ? name || 'Lesgroep bewerken' : 'Nieuwe lesgroep'}
					subtitle={isEditMode ? 'Wijzig de groepsinstellingen' : 'Stap voor stap een groepsles inplannen'}
				/>
			</div>

			<WizardStepIndicator<LGStep>
				step={step}
				stepIndex={stepIndex}
				highestReachedStepIndex={highestStep}
				onStepChange={setStep}
				steps={LG_STEPS}
			/>

			<div className="mt-6 max-w-3xl rounded-lg border bg-card p-6">
				{step === LGStep.Basics && (
					<div className="space-y-4 py-2">
						<div>
							<Label htmlFor="lg-name">Naam van de groep</Label>
							<Input
								id="lg-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Bijv. Bandklas vrijdag"
							/>
						</div>
						<div>
							<Label>Lessoort (groepsles)</Label>
							<LessonTypeSelect
								options={lessonTypes}
								value={lessonTypeId}
								onChange={(v) => {
									setLessonTypeId(v);
									setTeacherUserId(null);
									setSlot(null);
								}}
								placeholder={
									lessonTypes.length === 0
										? 'Geen groepslessen beschikbaar — maak eerst een groep-lessoort aan'
										: 'Selecteer lessoort...'
								}
							/>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label>Duur (min)</Label>
								<Input
									type="number"
									min={5}
									value={durationMinutes}
									onChange={(e) => {
										setDurationMinutes(Number(e.target.value) || 0);
										setSlot(null);
									}}
								/>
							</div>
							<div>
								<Label>Frequentie</Label>
								<Select
									value={frequency}
									onValueChange={(v) => {
										setFrequency(v as LessonFrequency);
										setSlot(null);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{frequencyOptions.map((f) => (
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
									onChange={(e) => setPricePerLesson(Number(e.target.value) || 0)}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="lg-start">Startdatum</Label>
								<DatePicker
									id="lg-start"
									value={startDate}
									onChange={(v) => {
										setStartDate(v);
										setSlot(null);
									}}
								/>
							</div>
							<div>
								<Label htmlFor="lg-end">Einddatum</Label>
								<DatePicker
									id="lg-end"
									value={endDate}
									onChange={(v) => {
										setEndDate(v);
										setSlot(null);
									}}
								/>
							</div>
						</div>
					</div>
				)}

				{step === LGStep.Teacher && (
					<div className="space-y-2 py-2">
						{teachers.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Geen actieve docenten gevonden die deze lessoort aanbieden. Koppel het lestype eerst aan
								een docent.
							</p>
						) : (
							<TeacherSlotStepContent
								teachers={teachers}
								selectedTeacher={selectedTeacher}
								includeUserIds={teachers.map((t) => t.userId)}
								slotsWithStatus={slots}
								selectedSlot={slot}
								loadingStep3={loadingSlots}
								isTeacherOwnStudent={false}
								onTeacherChange={(uid) => {
									setTeacherUserId(uid);
									setSlot(null);
								}}
								onSlotClick={(s) => {
									if (s.status === 'occupied') return;
									setSlot(s);
									if (s.status === 'partial') setPartialOpen(true);
								}}
							/>
						)}
					</div>
				)}

				{step === LGStep.Members && (
					<div className="space-y-4 py-2">
						<div>
							<Label>Leerlingen</Label>
							<UserSelectMultiple
								value={memberIds}
								onChange={(users) => setMemberIds(users.map((u) => u.user_id))}
								filter="students"
								placeholder="Voeg leerlingen toe..."
							/>
							<p className="mt-2 text-xs text-muted-foreground">
								Geselecteerd: {memberIds.length} {memberIds.length === 1 ? 'leerling' : 'leerlingen'}
								{memberIds.length > 0 && pricePerLesson > 0 && (
									<>
										{' '}
										· indicatieve omzet per les: €{' '}
										{(memberIds.length * pricePerLesson).toLocaleString('nl-NL', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</>
								)}
							</p>
							{memberIds.length === 0 && (
								<p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
									<LuTriangleAlert className="h-3 w-3" />
									Je kunt later nog leerlingen toevoegen.
								</p>
							)}
						</div>
					</div>
				)}

				{step === LGStep.Confirm && (
					<div className="space-y-4">
						<Card>
							<CardContent className="space-y-3 p-4 text-sm">
								<Row label="Naam" value={<span className="font-medium">{name || '-'}</span>} />
								<Row
									label="Lessoort"
									value={
										selectedLessonType ? <LessonTypeBadge lessonType={selectedLessonType} /> : '-'
									}
								/>
								<Row
									label="Schema"
									value={
										<span>
											{slot
												? `${DAY_NAMES[slot.day_of_week]} ${formatTime(slot.start_time)} · ${durationMinutes} min · ${frequencyLabels[frequency]}`
												: '-'}
										</span>
									}
								/>
								<Row
									label="Periode"
									value={`${formatDbDateToUi(startDate)} t/m ${endDate ? formatDbDateToUi(endDate) : 'Geen einde'}`}
								/>
								<Row
									label="Docent"
									value={
										selectedTeacher ? (
											<UserDisplay
												profile={{
													first_name: selectedTeacher.firstName,
													last_name: selectedTeacher.lastName,
													email: selectedTeacher.email,
													avatar_url: selectedTeacher.avatarUrl,
												}}
												showEmail
											/>
										) : (
											'-'
										)
									}
								/>
								<Row
									label="Prijs per deelnemer"
									value={`€ ${pricePerLesson.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
								/>
								<Row
									label={`Leerlingen (${memberIds.length})`}
									value={
										memberIds.length === 0 ? (
											<span className="text-muted-foreground">Nog geen leerlingen</span>
										) : (
											<Badge variant="secondary">
												{memberIds.length} {memberIds.length === 1 ? 'deelnemer' : 'deelnemers'}
											</Badge>
										)
									}
								/>
							</CardContent>
						</Card>

						{!isEditMode && (
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={scheduleInAgenda}
									onChange={(e) => setScheduleInAgenda(e.target.checked)}
									className="h-4 w-4 rounded border-input"
								/>
								Direct inplannen in de agenda als terugkerende afspraak
							</label>
						)}
					</div>
				)}
			</div>

			<div className="mt-6 max-w-3xl flex justify-between gap-2">
				{!isFirst ? (
					<Button variant="outline" onClick={goPrev}>
						Vorige
					</Button>
				) : (
					<Button variant="outline" onClick={() => navigate('/lesson-groups')}>
						Annuleren
					</Button>
				)}
				<div className="flex-1" />
				{!isLast ? (
					<Button onClick={goNext} disabled={stepIndex < highestStep ? false : !canProceed(step)}>
						Volgende
					</Button>
				) : (
					<SubmitButton onClick={handleSave} loading={saving} disabled={!canProceed(LGStep.Teacher)}>
						{isEditMode ? 'Opslaan' : 'Aanmaken'}
					</SubmitButton>
				)}
			</div>

			{partialOpen && slot && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
						<div className="mb-4 flex items-center gap-2">
							<LuTriangleAlert className="h-5 w-5 text-amber-500" />
							<h3 className="text-lg font-semibold">Deels bezet tijdslot</h3>
						</div>
						<p className="mb-6 text-muted-foreground">
							Dit tijdslot is deels bezet ({slot.occupiedOccurrences} van {slot.totalOccurrences}{' '}
							momenten). Weet je zeker dat je dit slot wilt gebruiken?
						</p>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setPartialOpen(false);
									setSlot(null);
								}}
							>
								Annuleren
							</Button>
							<Button onClick={() => setPartialOpen(false)}>
								<LuCircleCheck className="mr-2 h-4 w-4" /> Toch gebruiken
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1 border-b border-border py-2 last:border-0">
			<span className="text-xs font-medium text-muted-foreground">{label}</span>
			<div className="text-sm">{value}</div>
		</div>
	);
}
