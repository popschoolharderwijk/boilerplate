import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { WizardStep } from '@/components/agreements/WizardStepIndicator';
import { supabase } from '@/integrations/supabase/client';
import { getSlotStatuses, type SlotWithStatus } from '@/lib/agreementSlots';
import type { AgreementTableRow, LessonFrequency, WizardTeacherInfo } from '@/types/lesson-agreements';

type AgreementLoadParams = {
	id: string;
	navigate: NavigateFunction;
};

type AgreementLoadResult = {
	agreement: AgreementTableRow;
	loadedPeriod: { start_date: string; end_date: string | null };
};

type TeacherSlotsLoadParams = {
	teacherUserId: string;
	startDate: string;
	endDate: string;
	initialAgreement: AgreementTableRow | null;
	selectedLessonType: { duration_minutes: number; frequency: LessonFrequency };
};

type TeachersLoadParams = {
	lessonTypeId: string;
};

type SaveParams = {
	form: {
		studentUserId: string | null;
		lessonTypeId: string | null;
		teacherUserId: string | null;
		slot: SlotWithStatus | null;
		partnerStudentUserId: string | null;
		selectedOptionSnapshot: {
			duration_minutes: number;
			frequency: LessonFrequency;
			price_per_lesson: number;
		} | null;
		startDate: string;
		endDate: string;
		paymentMethod: 'stripe' | 'sepa' | 'manual';
		sepaMandateId: string | null;
	};
	agreement: AgreementTableRow | null;
	isDuoLesson: boolean;
	fromRequestId: string | null;
	fromTrialId: string | null;
	navigate: NavigateFunction;
};

export type WizardLoadPhase = 'agreement' | 'teacherSlots' | 'teachers' | 'save';

async function loadAgreement(params: AgreementLoadParams): Promise<AgreementLoadResult | null> {
	const { data, error } = await supabase
		.from('lesson_agreements')
		.select(
			`id, created_at, day_of_week, start_time, start_date, end_date, is_active, notes, 
			student_user_id, teacher_user_id, lesson_type_id, duration_minutes, frequency, price_per_lesson,
			payment_method, sepa_mandate_id,
			lesson_types(id, name, icon, color), 
			teachers(user_id)`,
		)
		.eq('id', params.id)
		.single();

	if (error || !data) {
		toast.error('Overeenkomst niet gevonden');
		params.navigate('/agreements');
		return null;
	}

	const teacher = Array.isArray(data.teachers) ? data.teachers[0] : data.teachers;
	const teacherUserId = teacher?.user_id;
	const lessonType = Array.isArray(data.lesson_types) ? data.lesson_types[0] : data.lesson_types;

	const [teacherProfile, studentProfile] = await Promise.all([
		teacherUserId
			? supabase
					.from('profiles')
					.select('first_name, last_name, email, avatar_url')
					.eq('user_id', teacherUserId)
					.single()
			: { data: null },
		supabase
			.from('profiles')
			.select('first_name, last_name, email, avatar_url')
			.eq('user_id', data.student_user_id)
			.single(),
	]);

	return {
		loadedPeriod: { start_date: data.start_date, end_date: data.end_date ?? null },
		agreement: {
			id: data.id,
			created_at: data.created_at,
			day_of_week: data.day_of_week,
			start_time: data.start_time,
			start_date: data.start_date,
			end_date: data.end_date,
			is_active: data.is_active,
			notes: data.notes,
			student_user_id: data.student_user_id,
			teacher_user_id: data.teacher_user_id,
			lesson_type_id: data.lesson_type_id,
			duration_minutes: data.duration_minutes,
			frequency: data.frequency,
			price_per_lesson: data.price_per_lesson,
			payment_method: (data as { payment_method?: string }).payment_method ?? 'stripe',
			sepa_mandate_id: (data as { sepa_mandate_id?: string | null }).sepa_mandate_id ?? null,
			student: {
				first_name: studentProfile.data?.first_name ?? null,
				last_name: studentProfile.data?.last_name ?? null,
				avatar_url: studentProfile.data?.avatar_url ?? null,
				email: studentProfile.data?.email ?? '',
			},
			teacher: {
				email: teacherProfile.data?.email ?? null,
				first_name: teacherProfile.data?.first_name ?? null,
				last_name: teacherProfile.data?.last_name ?? null,
				avatar_url: teacherProfile.data?.avatar_url ?? null,
			},
			lesson_type: {
				id: lessonType.id,
				name: lessonType.name,
				icon: lessonType.icon,
				color: lessonType.color,
			},
		},
	};
}

async function loadTeacherSlots(params: TeacherSlotsLoadParams): Promise<SlotWithStatus[] | null> {
	const [avail, agreements] = await Promise.all([
		supabase
			.from('teacher_availability')
			.select('day_of_week, start_time, end_time')
			.eq('teacher_user_id', params.teacherUserId),
		supabase
			.from('lesson_agreements')
			.select('id, day_of_week, start_time, start_date, end_date, duration_minutes, frequency')
			.eq('teacher_user_id', params.teacherUserId)
			.lte('start_date', params.endDate),
	]);

	if (avail.error) {
		toast.error('Fout bij laden beschikbaarheid');
		return null;
	}

	const filteredAgreements = (agreements.data ?? [])
		.filter((a) => a.start_date <= params.endDate && (a.end_date === null || a.end_date >= params.startDate))
		.filter((a) => !params.initialAgreement || a.id !== params.initialAgreement.id)
		.map((a) => ({
			day_of_week: a.day_of_week,
			start_time: a.start_time,
			start_date: a.start_date,
			end_date: a.end_date,
			frequency: a.frequency,
			duration_minutes: a.duration_minutes,
		}));

	return getSlotStatuses(
		new Date(params.startDate),
		new Date(params.endDate),
		avail.data ?? [],
		filteredAgreements,
		params.selectedLessonType.duration_minutes,
		params.selectedLessonType.frequency,
	);
}

async function loadTeachers(params: TeachersLoadParams): Promise<WizardTeacherInfo[]> {
	const { data: tltData } = await supabase
		.from('teacher_lesson_types')
		.select('teacher_user_id')
		.eq('lesson_type_id', params.lessonTypeId);

	if (!tltData?.length) return [];

	const teacherUserIds = tltData.map((r) => r.teacher_user_id);
	const { data: teachersData } = await supabase
		.from('teachers')
		.select('user_id')
		.in('user_id', teacherUserIds)
		.eq('is_active', true);

	if (!teachersData?.length) return [];

	const userIds = teachersData.map((t) => t.user_id);
	const { data: profiles } = await supabase
		.from('profiles')
		.select('user_id, first_name, last_name, email, avatar_url')
		.in('user_id', userIds);

	const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

	return teachersData.map((t) => {
		const p = profileMap.get(t.user_id);
		return {
			id: t.user_id,
			userId: t.user_id,
			firstName: p?.first_name ?? null,
			lastName: p?.last_name ?? null,
			email: p?.email ?? null,
			avatarUrl: p?.avatar_url ?? null,
		};
	});
}

async function saveWizardAgreement(params: SaveParams): Promise<boolean> {
	const { form, agreement, isDuoLesson, fromRequestId, fromTrialId, navigate } = params;

	if (
		!form.studentUserId ||
		!form.lessonTypeId ||
		!form.teacherUserId ||
		!form.slot ||
		form.slot.status === 'occupied'
	) {
		toast.error('Selecteer alle verplichte velden');
		return false;
	}

	const timeValue = form.slot.start_time.includes(':') ? form.slot.start_time : form.slot.start_time + ':00';

	if (!agreement && isDuoLesson) {
		if (!form.partnerStudentUserId || form.partnerStudentUserId === form.studentUserId) {
			toast.error('Kies een duo-partner (verschillende leerling)');
			return false;
		}
		if (!form.selectedOptionSnapshot) {
			toast.error('Selecteer een lesoptie');
			return false;
		}
		const { data: duoData, error: duoErr } = await supabase.functions.invoke<{
			agreement_ids: string[];
			duo_pair_id: string;
		}>('create-duo-agreements', {
			body: {
				student_user_id_a: form.studentUserId,
				student_user_id_b: form.partnerStudentUserId,
				teacher_user_id: form.teacherUserId,
				lesson_type_id: form.lessonTypeId,
				day_of_week: form.slot.day_of_week,
				start_time: timeValue,
				duration_minutes: form.selectedOptionSnapshot.duration_minutes,
				frequency: form.selectedOptionSnapshot.frequency,
				price_per_lesson: form.selectedOptionSnapshot.price_per_lesson,
				start_date: form.startDate,
				end_date: form.endDate || null,
				signup_source: fromRequestId ? 'public_form' : 'staff_duo',
			},
		});
		if (duoErr || !duoData?.agreement_ids?.length) {
			toast.error(duoErr?.message ?? 'Fout bij aanmaken duo-overeenkomsten');
			return false;
		}
		const inviteResults = await Promise.all(
			duoData.agreement_ids.map((aid) =>
				supabase.functions.invoke('send-incasso-invite', { body: { lesson_agreement_id: aid } }),
			),
		);
		const failedInvites = inviteResults.filter((r) => r.error).length;
		if (failedInvites > 0) {
			toast.warning(
				`Duo-overeenkomsten opgeslagen, maar ${failedInvites} betaaluitnodiging(en) konden niet worden verstuurd`,
			);
		} else {
			toast.success('Duo-overeenkomsten toegevoegd — betaaluitnodigingen verstuurd');
		}
		navigate('/agreements');
		return true;
	}

	const payload = {
		teacher_user_id: form.teacherUserId,
		day_of_week: form.slot.day_of_week,
		start_time: timeValue,
		start_date: form.startDate,
		end_date: form.endDate || null,
	};

	const insertResult = agreement
		? await supabase.from('lesson_agreements').update(payload).eq('id', agreement.id).select('id').maybeSingle()
		: await supabase
				.from('lesson_agreements')
				.insert({
					...payload,
					student_user_id: form.studentUserId,
					lesson_type_id: form.lessonTypeId,
					duration_minutes: form.selectedOptionSnapshot ? form.selectedOptionSnapshot.duration_minutes : 30,
					frequency: form.selectedOptionSnapshot ? form.selectedOptionSnapshot.frequency : 'weekly',
					price_per_lesson: form.selectedOptionSnapshot ? form.selectedOptionSnapshot.price_per_lesson : 30,
					is_active: true,
					signup_source: fromRequestId ? 'public_form' : 'staff',
				})
				.select('id')
				.single();

	if (insertResult.error) {
		toast.error(insertResult.error.message.includes('unique') ? 'Deze combinatie bestaat al' : 'Fout bij opslagen');
		return false;
	}

	if (fromRequestId && !agreement && insertResult.data?.id) {
		await supabase
			.from('lesson_signup_requests')
			.update({
				status: 'approved',
				processed_at: new Date().toISOString(),
				created_agreement_id: insertResult.data.id,
			})
			.eq('id', fromRequestId);
	}

	if (fromTrialId && !agreement && insertResult.data?.id) {
		await supabase
			.from('trial_lessons')
			.update({
				status: 'converted',
				admin_processed_at: new Date().toISOString(),
				created_agreement_id: insertResult.data.id,
			})
			.eq('id', fromTrialId);
	}

	if (!agreement && insertResult.data?.id) {
		const { error: inviteErr } = await supabase.functions.invoke('send-incasso-invite', {
			body: { lesson_agreement_id: insertResult.data.id },
		});
		if (inviteErr) {
			toast.warning('Overeenkomst opgeslagen, maar betaaluitnodiging kon niet worden verstuurd');
		} else {
			toast.success('Overeenkomst toegevoegd — betaaluitnodiging verstuurd naar de leerling');
		}
	} else {
		toast.success(agreement ? 'Overeenkomst bijgewerkt' : 'Overeenkomst toegevoegd');
	}
	navigate(fromRequestId ? '/aanmeldingen' : fromTrialId ? '/trial-lessons' : '/agreements');
	return true;
}

export async function runWizardLoad(
	phase: 'agreement',
	params: AgreementLoadParams,
): Promise<AgreementLoadResult | null>;
export async function runWizardLoad(
	phase: 'teacherSlots',
	params: TeacherSlotsLoadParams,
): Promise<SlotWithStatus[] | null>;
export async function runWizardLoad(phase: 'teachers', params: TeachersLoadParams): Promise<WizardTeacherInfo[]>;
export async function runWizardLoad(phase: 'save', params: SaveParams): Promise<boolean>;
export async function runWizardLoad(
	phase: WizardLoadPhase,
	params: AgreementLoadParams | TeacherSlotsLoadParams | TeachersLoadParams | SaveParams,
): Promise<AgreementLoadResult | null | SlotWithStatus[] | null | WizardTeacherInfo[] | boolean> {
	switch (phase) {
		case 'agreement':
			return loadAgreement(params as AgreementLoadParams);
		case 'teacherSlots':
			return loadTeacherSlots(params as TeacherSlotsLoadParams);
		case 'teachers':
			return loadTeachers(params as TeachersLoadParams);
		case 'save':
			return saveWizardAgreement(params as SaveParams);
	}
}

/** Used by useTeachers to skip loading on early wizard steps. */
export function shouldLoadTeachers(step: WizardStep, lessonTypeId: string | null): lessonTypeId is string {
	return step !== WizardStep.User && step !== WizardStep.Period && lessonTypeId !== null;
}

type SelectedLessonTypeSnapshot = { duration_minutes: number; frequency: LessonFrequency };

export function shouldLoadTeacherSlots(
	step: WizardStep,
	teacherUserId: string | null,
	lessonTypeId: string | null,
	startDate: string,
	endDate: string,
	selectedLessonType: SelectedLessonTypeSnapshot | undefined,
): selectedLessonType is SelectedLessonTypeSnapshot {
	return (
		step === WizardStep.TeacherSlot &&
		teacherUserId !== null &&
		lessonTypeId !== null &&
		startDate !== '' &&
		endDate !== '' &&
		selectedLessonType !== undefined
	);
}

export { agreementBreadcrumbItems, wizardInitFromAgreement } from '@/lib/agreements/agreementWizardHelpers';
