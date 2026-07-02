import { useEffect, useMemo, useRef, useState } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ConfirmStepContent } from '@/components/agreements/ConfirmStepContent';
import { PaymentMethodSection } from '@/components/agreements/PaymentMethodSection';
import { PeriodStepContent } from '@/components/agreements/PeriodStepContent';
import { TeacherSlotStepContent } from '@/components/agreements/TeacherSlotStepContent';
import { UserStepContent } from '@/components/agreements/UserStepContent';
import { STEP_ORDER, WizardStep, WizardStepIndicator } from '@/components/agreements/WizardStepIndicator';
import { NavPageHeaderIcon } from '@/components/layout/NavPageHeaderIcon';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useAutofocus } from '@/hooks/useAutofocus';
import { supabase } from '@/integrations/supabase/client';
import type { SlotWithStatus } from '@/lib/agreementSlots';
import { addDaysFromNow, addYearsFromNow, formatDateToDb } from '@/lib/date/date-format';
import { formatTime } from '@/lib/time/time-format';
import {
	agreementBreadcrumbItems,
	runWizardLoad,
	shouldLoadTeacherSlots,
	shouldLoadTeachers,
	wizardInitFromAgreement,
} from '@/pages/agreementWizardLoaders';
import type {
	AgreementTableRow,
	LessonFrequency,
	LessonTypeOptionSnapshot,
	WizardLessonTypeInfo,
	WizardTeacherInfo,
} from '@/types/lesson-agreements';
import type { User } from '@/types/users';

function tomorrow(): string {
	return formatDateToDb(addDaysFromNow(1));
}

function oneYearFromToday(): string {
	return formatDateToDb(addYearsFromNow(1));
}

function useAgreement(id: string | undefined, isEditMode: boolean) {
	const [agreement, setAgreement] = useState<AgreementTableRow | null>(null);
	const [loading, setLoading] = useState(isEditMode);
	const loadedPeriodRef = useRef<{ start_date: string; end_date: string | null } | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (!isEditMode || !id) {
			setLoading(false);
			return;
		}
		void runWizardLoad('agreement', { id, navigate }).then((result) => {
			if (!result) return;
			loadedPeriodRef.current = result.loadedPeriod;
			setAgreement(result.agreement);
			setLoading(false);
		});
	}, [id, isEditMode, navigate]);

	return { agreement, loading, loadedPeriod: loadedPeriodRef };
}

function useLessonTypes() {
	const [types, setTypes] = useState<
		Array<{ id: string; name: string; icon: string; color: string; is_duo_lesson: boolean }>
	>([]);

	useEffect(() => {
		void supabase
			.from('lesson_types')
			.select('id, name, icon, color, is_duo_lesson')
			.eq('is_active', true)
			.order('name')
			.then(({ data }) => setTypes((data ?? []).map((t) => ({ ...t, is_duo_lesson: t.is_duo_lesson ?? false }))));
	}, []);

	return types;
}

function useLessonTypeOptions(lessonTypeId: string | null) {
	const [options, setOptions] = useState<LessonTypeOptionSnapshot[]>([]);

	useEffect(() => {
		if (!lessonTypeId) {
			setOptions([]);
			return;
		}
		void supabase
			.from('lesson_type_options')
			.select('id, duration_minutes, frequency, price_per_lesson')
			.eq('lesson_type_id', lessonTypeId)
			.order('duration_minutes')
			.order('frequency')
			.then(({ data }) => setOptions(data ?? []));
	}, [lessonTypeId]);

	return options;
}

function useTeacherSlots(
	step: WizardStep,
	teacherUserId: string | null,
	lessonTypeId: string | null,
	startDate: string,
	endDate: string,
	initialAgreement: AgreementTableRow | null,
	selectedLessonType: { duration_minutes: number; frequency: LessonFrequency } | undefined,
) {
	const [slots, setSlots] = useState<SlotWithStatus[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!shouldLoadTeacherSlots(step, teacherUserId, lessonTypeId, startDate, endDate, selectedLessonType)) {
			setSlots([]);
			setLoading(false);
			return;
		}
		let active = true;
		setLoading(true);
		void runWizardLoad('teacherSlots', {
			teacherUserId,
			startDate,
			endDate,
			initialAgreement,
			selectedLessonType,
		})
			.then((statuses) => {
				if (!active) return;
				setSlots(statuses ?? []);
			})
			.catch(() => {
				if (!active) return;
				setSlots([]);
			})
			.finally(() => {
				if (!active) return;
				setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [step, teacherUserId, lessonTypeId, startDate, endDate, initialAgreement, selectedLessonType]);

	return { slots, loading };
}

function useTeachers(step: WizardStep, lessonTypeId: string | null) {
	const [teachers, setTeachers] = useState<WizardTeacherInfo[]>([]);

	useEffect(() => {
		if (!shouldLoadTeachers(step, lessonTypeId)) {
			setTeachers([]);
			return;
		}
		void runWizardLoad('teachers', { lessonTypeId }).then(setTeachers);
	}, [step, lessonTypeId]);

	return teachers;
}

export default function AgreementWizard() {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const fromRequestId = searchParams.get('fromRequest');
	const fromTrialId = searchParams.get('fromTrial');
	const prefillStudentUserId = searchParams.get('studentUserId');
	const prefillLessonTypeId = searchParams.get('lessonTypeId');
	const prefillOptionId = searchParams.get('optionId');
	const navigate = useNavigate();
	const { setBreadcrumbSuffix } = useBreadcrumb();

	const isEditMode = id !== undefined && id !== 'new';

	const { agreement, loading: loadingAgreement, loadedPeriod } = useAgreement(id, isEditMode);
	const lessonTypes = useLessonTypes();

	const [step, setStep] = useState<WizardStep>(WizardStep.User);
	const [form, setForm] = useState({
		studentUserId: null as string | null,
		user: null as User | null,
		lessonTypeId: null as string | null,
		selectedOptionSnapshot: null as {
			duration_minutes: number;
			frequency: LessonFrequency;
			price_per_lesson: number;
		} | null,
		startDate: tomorrow(),
		endDate: oneYearFromToday(),
		teacherUserId: null as string | null,
		slot: null as SlotWithStatus | null,
		partnerStudentUserId: null as string | null,
		partnerUser: null as User | null,
		paymentMethod: 'sepa' as 'stripe' | 'sepa' | 'manual',
		sepaMandateId: null as string | null,
	});

	const [highestStep, setHighestStep] = useState(0);
	const [partialConfirmOpen, setPartialConfirmOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const startDatePickerRef = useAutofocus<HTMLButtonElement>(step === WizardStep.Period);

	useEffect(() => {
		if (isEditMode || !prefillStudentUserId) return;
		void supabase
			.from('profiles')
			.select('user_id, first_name, last_name, email, avatar_url, phone_number')
			.eq('user_id', prefillStudentUserId)
			.maybeSingle()
			.then(({ data: profile }) => {
				setForm((f) => ({
					...f,
					studentUserId: prefillStudentUserId,
					lessonTypeId: prefillLessonTypeId ?? f.lessonTypeId,
					user: profile
						? {
								user_id: profile.user_id,
								first_name: profile.first_name,
								last_name: profile.last_name,
								email: profile.email,
								avatar_url: profile.avatar_url,
								phone_number: profile.phone_number,
							}
						: f.user,
				}));
			});
	}, [isEditMode, prefillStudentUserId, prefillLessonTypeId]);

	const teachers = useTeachers(step, form.lessonTypeId);
	const lessonTypeOptions = useLessonTypeOptions(form.lessonTypeId);

	useEffect(() => {
		if (isEditMode || !prefillOptionId || lessonTypeOptions.length === 0) return;
		setForm((f) => {
			if (f.selectedOptionSnapshot) return f;
			const opt = lessonTypeOptions.find((o) => o.id === prefillOptionId);
			if (!opt) return f;
			return {
				...f,
				selectedOptionSnapshot: {
					duration_minutes: opt.duration_minutes,
					frequency: opt.frequency,
					price_per_lesson: opt.price_per_lesson,
				},
			};
		});
	}, [isEditMode, prefillOptionId, lessonTypeOptions]);

	const matchedLessonType = agreement ? null : lessonTypes.find((lt) => lt.id === form.lessonTypeId);
	const selectedLessonType = useMemo<WizardLessonTypeInfo | undefined>(() => {
		if (agreement) {
			return {
				id: agreement.lesson_type_id,
				name: agreement.lesson_type.name,
				icon: agreement.lesson_type.icon,
				color: agreement.lesson_type.color,
				duration_minutes: agreement.duration_minutes,
				frequency: agreement.frequency,
				price_per_lesson: agreement.price_per_lesson,
			};
		}

		if (!matchedLessonType || !form.selectedOptionSnapshot) return undefined;

		return {
			id: matchedLessonType.id,
			name: matchedLessonType.name,
			icon: matchedLessonType.icon,
			color: matchedLessonType.color,
			duration_minutes: form.selectedOptionSnapshot.duration_minutes,
			frequency: form.selectedOptionSnapshot.frequency,
			price_per_lesson: form.selectedOptionSnapshot.price_per_lesson,
		};
	}, [agreement, matchedLessonType, form.selectedOptionSnapshot]);

	const { slots: slotsWithStatus, loading: loadingSlots } = useTeacherSlots(
		step,
		form.teacherUserId,
		form.lessonTypeId,
		form.startDate,
		form.endDate,
		agreement,
		selectedLessonType,
	);

	const selectedTeacher =
		teachers.length > 0
			? teachers.find((t) => t.id === form.teacherUserId)
			: agreement?.teacher
				? {
						id: agreement.teacher_user_id,
						userId: '',
						firstName: agreement.teacher.first_name,
						lastName: agreement.teacher.last_name,
						email: agreement.teacher.email ?? '',
						avatarUrl: agreement.teacher.avatar_url,
					}
				: undefined;

	const effectiveSlot = form.slot
		? form.slot
		: agreement?.day_of_week
			? {
					day_of_week: agreement.day_of_week,
					start_time: agreement.start_time,
					end_time: agreement.start_time,
					status: 'free' as const,
					occupiedOccurrences: 0,
					totalOccurrences: 0,
				}
			: null;

	const hasChanges = agreement
		? agreement.start_date !== form.startDate ||
			(agreement.end_date ?? '') !== form.endDate ||
			agreement.teacher_user_id !== form.teacherUserId ||
			agreement.day_of_week !== effectiveSlot?.day_of_week ||
			formatTime(agreement.start_time) !== (effectiveSlot ? formatTime(effectiveSlot.start_time) : '') ||
			(agreement.payment_method ?? 'stripe') !== form.paymentMethod ||
			(agreement.sepa_mandate_id ?? null) !== (form.paymentMethod === 'sepa' ? form.sepaMandateId : null)
		: false;

	const isTeacherOwnStudent = selectedTeacher && form.studentUserId && selectedTeacher.userId === form.studentUserId;

	useEffect(() => {
		const init = wizardInitFromAgreement(loadingAgreement, isEditMode, agreement, oneYearFromToday());
		if (!init) return;
		setStep(init.step);
		setHighestStep(init.highestStep);
		if (init.formPatch) setForm((f) => ({ ...f, ...init.formPatch }));
	}, [loadingAgreement, isEditMode, agreement]);

	useEffect(() => {
		const suffix = agreementBreadcrumbItems(loadingAgreement, isEditMode, agreement, id);
		if (!suffix) return;
		setBreadcrumbSuffix(suffix);
		return () => setBreadcrumbSuffix([]);
	}, [loadingAgreement, isEditMode, agreement, id, setBreadcrumbSuffix]);

	const stepIndex = STEP_ORDER.indexOf(step);
	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === STEP_ORDER.length - 1;
	const isDuoLesson = !isEditMode && Boolean(lessonTypes.find((t) => t.id === form.lessonTypeId)?.is_duo_lesson);

	const stepCanProceed =
		step === WizardStep.User
			? Boolean(
					form.studentUserId &&
						form.lessonTypeId &&
						(isEditMode || form.selectedOptionSnapshot) &&
						(!isDuoLesson ||
							(form.partnerStudentUserId && form.partnerStudentUserId !== form.studentUserId)),
				)
			: step === WizardStep.Period
				? Boolean(form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate))
				: step === WizardStep.TeacherSlot
					? Boolean(form.slot && form.slot.status !== 'occupied' && !isTeacherOwnStudent)
					: step === WizardStep.Confirm;

	const nextStep = () => {
		if (isLastStep) return;
		const next = stepIndex + 1;
		setStep(STEP_ORDER[next]);
		if (next > highestStep) setHighestStep(next);
	};

	const prevStep = () => {
		if (!isFirstStep) setStep(STEP_ORDER[stepIndex - 1]);
	};

	const handleSave = () => {
		setSaving(true);
		void runWizardLoad('save', {
			form,
			agreement,
			isDuoLesson,
			fromRequestId,
			fromTrialId,
			navigate,
		}).finally(() => setSaving(false));
	};

	if (loadingAgreement) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-muted-foreground">Laden...</div>
			</div>
		);
	}

	const studentName =
		isEditMode && agreement
			? [agreement.student.first_name, agreement.student.last_name].filter(Boolean).join(' ') ||
				agreement.student.email
			: null;
	const studentInitials =
		isEditMode && agreement
			? agreement.student.first_name && agreement.student.last_name
				? `${agreement.student.first_name[0]}${agreement.student.last_name[0]}`.toUpperCase()
				: agreement.student.first_name
					? agreement.student.first_name.slice(0, 2).toUpperCase()
					: agreement.student.email.slice(0, 2).toUpperCase()
			: '?';

	return (
		<>
			<div className="mb-6">
				<PageHeader
					icon={
						isEditMode && agreement ? (
							<Avatar className="h-16 w-16">
								{agreement.student.avatar_url && (
									<AvatarImage src={agreement.student.avatar_url} alt={studentName ?? ''} />
								)}
								<AvatarFallback className="bg-primary/10 text-primary text-xl">
									{studentInitials}
								</AvatarFallback>
							</Avatar>
						) : (
							<NavPageHeaderIcon name="agreements" />
						)
					}
					title={
						isEditMode && agreement ? (
							<Link to={`/students/${agreement.student_user_id}`} className="hover:underline">
								{studentName}
							</Link>
						) : (
							'Nieuwe overeenkomst'
						)
					}
					subtitle={isEditMode && agreement ? agreement.lesson_type.name : undefined}
				/>
			</div>

			<WizardStepIndicator<WizardStep>
				step={step}
				stepIndex={stepIndex}
				highestReachedStepIndex={highestStep}
				onStepChange={setStep}
			/>

			<div className="mt-6 max-w-2xl rounded-lg border bg-card p-6">
				{step === WizardStep.User && (
					<UserStepContent
						isEditMode={isEditMode}
						selectedStudentUserId={form.studentUserId}
						selectedUser={form.user}
						selectedLessonTypeId={form.lessonTypeId}
						selectedLessonType={selectedLessonType}
						lessonTypes={lessonTypes.map((lt) => ({
							id: lt.id,
							name: lt.name,
							icon: lt.icon,
							color: lt.color,
						}))}
						lessonTypeOptions={lessonTypeOptions}
						selectedOptionSnapshot={form.selectedOptionSnapshot}
						onStudentUserIdChange={(v) => setForm((f) => ({ ...f, studentUserId: v }))}
						onUserChange={(v) => setForm((f) => ({ ...f, user: v }))}
						onLessonTypeChange={(v) =>
							setForm((f) => ({
								...f,
								lessonTypeId: v,
								selectedOptionSnapshot: null,
								partnerStudentUserId: null,
								partnerUser: null,
							}))
						}
						onOptionSnapshotChange={(snap) => setForm((f) => ({ ...f, selectedOptionSnapshot: snap }))}
						isDuoLesson={isDuoLesson}
						partnerStudentUserId={form.partnerStudentUserId}
						partnerUser={form.partnerUser}
						onPartnerStudentUserIdChange={(v) => setForm((f) => ({ ...f, partnerStudentUserId: v }))}
						onPartnerUserChange={(v) => setForm((f) => ({ ...f, partnerUser: v }))}
					/>
				)}

				{step === WizardStep.Period && (
					<PeriodStepContent
						startDate={form.startDate}
						endDate={form.endDate}
						onStartDateChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
						onEndDateChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
						startDatePickerRef={startDatePickerRef}
					/>
				)}

				{step === WizardStep.TeacherSlot && (
					<TeacherSlotStepContent
						teachers={teachers}
						selectedTeacher={selectedTeacher}
						excludeUserIds={form.studentUserId ? [form.studentUserId] : []}
						includeUserIds={teachers.map((t) => t.userId)}
						slotsWithStatus={slotsWithStatus}
						selectedSlot={form.slot}
						currentAgreementSlot={
							isEditMode && agreement && form.teacherUserId === agreement.teacher_user_id
								? { day_of_week: agreement.day_of_week, start_time: agreement.start_time }
								: null
						}
						loadingStep3={loadingSlots}
						isTeacherOwnStudent={isTeacherOwnStudent}
						onTeacherChange={(v) => setForm((f) => ({ ...f, teacherUserId: v, slot: null }))}
						onSlotClick={(slot) => {
							if (slot.status === 'occupied') return;
							if (slot.status === 'partial') {
								setForm((f) => ({ ...f, slot }));
								setPartialConfirmOpen(true);
								return;
							}
							setForm((f) => ({ ...f, slot }));
						}}
					/>
				)}

				{step === WizardStep.Confirm && (
					<div className="space-y-6">
						<div className="text-center mb-4">
							<h3 className="text-lg font-semibold">
								{hasChanges ? 'Controleer je wijzigingen' : 'Overzicht'}
							</h3>
							<p className="text-sm text-muted-foreground">
								{isEditMode
									? hasChanges
										? 'Bekijk de wijzigingen en bevestig om op te slaan.'
										: ''
									: 'Bekijk de samenvatting en bevestig om de overeenkomst aan te maken.'}
							</p>
						</div>
						<ConfirmStepContent
							isEditMode={isEditMode}
							hasChanges={hasChanges}
							initialAgreement={agreement}
							loadedPeriod={loadedPeriod.current}
							selectedUser={form.user}
							selectedLessonType={selectedLessonType}
							startDate={form.startDate}
							endDate={form.endDate}
							selectedTeacherUserId={form.teacherUserId}
							selectedTeacher={selectedTeacher}
							effectiveSlot={effectiveSlot}
						/>
						<PaymentMethodSection
							paymentMethod={form.paymentMethod}
							sepaMandateId={form.sepaMandateId}
							studentUserId={form.studentUserId}
							onPaymentMethodChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}
							onSepaMandateIdChange={(v) => setForm((f) => ({ ...f, sepaMandateId: v }))}
						/>
					</div>
				)}
			</div>

			<div className="mt-6 max-w-2xl flex justify-between gap-2">
				{!isFirstStep && (
					<Button variant="outline" onClick={prevStep}>
						Vorige
					</Button>
				)}
				<div className="flex-1" />
				{!isLastStep ? (
					<Button onClick={nextStep} disabled={stepIndex < highestStep ? false : !stepCanProceed}>
						Volgende
					</Button>
				) : (
					<Button
						onClick={handleSave}
						disabled={
							!form.slot ||
							form.slot.status === 'occupied' ||
							saving ||
							isTeacherOwnStudent ||
							(form.paymentMethod === 'sepa' && !form.sepaMandateId) ||
							(isEditMode && !hasChanges)
						}
					>
						{saving ? 'Opslaan...' : isEditMode ? 'Opslaan' : 'Bevestigen'}
					</Button>
				)}
			</div>

			{partialConfirmOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
						<div className="flex items-center gap-2 mb-4">
							<LuTriangleAlert className="h-5 w-5 text-amber-500" />
							<h3 className="text-lg font-semibold">Deels bezet tijdslot</h3>
						</div>
						<p className="text-muted-foreground mb-6">
							Dit tijdslot is deels bezet in de gekozen periode
							{form.slot?.totalOccurrences != null && form.slot?.occupiedOccurrences != null && (
								<>
									{' '}
									({form.slot.occupiedOccurrences} van {form.slot.totalOccurrences} momenten bezet)
								</>
							)}
							. Weet je zeker dat je dit tijdslot wilt gebruiken?
						</p>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setPartialConfirmOpen(false)}>
								Annuleren
							</Button>
							<Button onClick={() => setPartialConfirmOpen(false)}>Toch gebruiken</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
