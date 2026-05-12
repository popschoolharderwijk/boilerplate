/**
 * Berekent een live preview van het jaar/maand-bedrag voor een lesovereenkomst,
 * gebaseerd op:
 *   - de matching `lesson_type_options` (voor leeftijdstarieven),
 *   - de geboortedatum van de leerling (om <21 vs adult te kiezen),
 *   - alle `no_lesson_periods` in het schooljaar.
 *
 * Het schooljaar is dat van vandaag (of de start_date als die in de toekomst ligt),
 * begrensd door agreement.start_date / end_date.
 */

import { useEffect, useState } from 'react';
import { pickAgeTariff, pickPriceCents } from '@/lib/billing/ageTariff';
import {
	type CalculateYearlyAmountResult,
	calculateYearlyAmount,
} from '@/lib/billing/calculateYearlyAmount';
import { clampToSchoolYear, getSchoolYearForDateString } from '@/lib/billing/schoolYear';
import { supabase } from '@/integrations/supabase/client';
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

export interface AgreementBillingPreview extends CalculateYearlyAmountResult {
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
		// Stabiele deps: object-referentie kan nieuw zijn elke render, maar inhoud telt.
		// biome-ignore lint/correctness/useExhaustiveDependencies: bewust per veld
	}, [
		agreement?.id,
		agreement?.student_user_id,
		agreement?.lesson_type_id,
		agreement?.frequency,
		agreement?.duration_minutes,
		agreement?.day_of_week,
		agreement?.start_date,
		agreement?.end_date,
	]);

	return { preview, loading, error };
}
