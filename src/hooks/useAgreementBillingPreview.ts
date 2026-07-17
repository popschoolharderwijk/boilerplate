/**
 * Computes a live yearly/monthly amount preview for a lesson agreement, based on:
 *   - the matching `lesson_type_options` (for age tariffs),
 *   - the student's date of birth (to choose under_21 vs adult),
 *   - all `no_lesson_periods` in the school year.
 *
 * The school year is today's (or start_date when that is in the future),
 * clamped by agreement.start_date / end_date.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pickAgeTariff, pickPriceCents } from '@/lib/billing/ageTariff';
import { type CalculateYearlyAmountResult, calculateYearlyAmount } from '@/lib/billing/calculateYearlyAmount';
import { clampToSchoolYear, getSchoolYearForDateString } from '@/lib/billing/schoolYear';
import type { LessonFrequency } from '@/types/lesson-agreements';

interface AgreementInput {
	id: string;
	student_user_id: string;
	lesson_type_id: string;
	frequency: LessonFrequency;
	duration_minutes: number;
	day_of_week: number;
	start_date: string;
	end_date: string | null;
}

interface AgreementBillingPreview extends CalculateYearlyAmountResult {
	tariff: 'under_21' | 'adult';
	pricePerLessonCents: number;
	schoolYearLabel: string;
	periodStart: string;
	periodEnd: string;
}

interface UseAgreementBillingPreviewResult {
	preview: AgreementBillingPreview | null;
	loading: boolean;
	error: string | null;
}

export function useAgreementBillingPreview(
	agreement: AgreementInput | null | undefined,
): UseAgreementBillingPreviewResult {
	const [preview, setPreview] = useState<AgreementBillingPreview | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		if (!agreement) {
			setPreview(null);
			setError(null);
			return;
		}

		async function load(input: AgreementInput) {
			setLoading(true);
			setError(null);

			const today = new Date().toISOString().slice(0, 10);
			const referenceDate = input.start_date > today ? input.start_date : today;
			const schoolYear = getSchoolYearForDateString(referenceDate);
			const window = clampToSchoolYear(schoolYear, input.start_date, input.end_date);

			if (!window) {
				if (!cancelled) {
					setPreview(null);
					setLoading(false);
				}
				return;
			}

			const [{ data: option, error: optErr }, { data: student, error: studErr }, { data: noLessonData }] =
				await Promise.all([
					supabase
						.from('lesson_type_options')
						.select('price_per_lesson_under_21_cents, price_per_lesson_adult_cents')
						.eq('lesson_type_id', input.lesson_type_id)
						.eq('frequency', input.frequency)
						.eq('duration_minutes', input.duration_minutes)
						.maybeSingle(),
					supabase
						.from('students')
						.select('date_of_birth')
						.eq('user_id', input.student_user_id)
						.maybeSingle(),
					supabase.from('no_lesson_periods').select('start_date, end_date'),
				]);

			if (cancelled) return;

			if (optErr || studErr) {
				setError(optErr?.message ?? studErr?.message ?? 'Kon prijsgegevens niet laden');
				setLoading(false);
				return;
			}

			if (!option) {
				setError('Geen prijs ingesteld voor deze duur/frequentie. Stel deze in bij het lessoort.');
				setPreview(null);
				setLoading(false);
				return;
			}

			const tariff = pickAgeTariff(student?.date_of_birth ?? null, window.start);
			const pricePerLessonCents = pickPriceCents(option, tariff) ?? 0;

			if (pricePerLessonCents <= 0) {
				setError(
					tariff === 'under_21'
						? 'Geen prijs <21 ingesteld voor deze duur/frequentie.'
						: 'Geen prijs 21+ ingesteld voor deze duur/frequentie.',
				);
				setPreview(null);
				setLoading(false);
				return;
			}

			const result = calculateYearlyAmount({
				periodStart: window.start,
				periodEnd: window.end,
				dayOfWeek: input.day_of_week,
				frequency: input.frequency,
				pricePerLessonCents,
				noLessonPeriods: noLessonData ?? [],
			});

			setPreview({
				...result,
				tariff,
				pricePerLessonCents,
				schoolYearLabel: `${schoolYear.startYear}/${schoolYear.startYear + 1}`,
				periodStart: window.start,
				periodEnd: window.end,
			});
			setLoading(false);
		}

		void load(agreement);
		return () => {
			cancelled = true;
		};
	}, [agreement]);

	return { preview, loading, error };
}
