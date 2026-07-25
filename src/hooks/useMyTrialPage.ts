import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { type EnrichedTrialLessonStudent, enrichTrialLessons } from '@/lib/trial-lessons/enrichTrialLessons';
import {
	applyTrialDecisionToList,
	resolveLatestTrial,
	resolveTrialDecisionSuccessToast,
	type TrialDecision,
} from '@/lib/trial-lessons/myTrialHelpers';

type Trial = EnrichedTrialLessonStudent;

export function useMyTrialPage(userId: string | undefined) {
	const [trials, setTrials] = useState<Trial[]>([]);
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;

		void (async () => {
			setLoading(true);
			const { data } = await supabase
				.from('trial_lessons')
				.select('*')
				.eq('student_user_id', userId)
				.order('scheduled_date', { ascending: false });
			if (cancelled) return;
			const list = data ?? [];
			setTrials((await enrichTrialLessons(list)) as Trial[]);
			setLoading(false);
		})();

		return () => {
			cancelled = true;
		};
	}, [userId]);

	const decide = useCallback(async (trialId: string, decision: TrialDecision) => {
		setBusyId(trialId);
		const { error } = await supabase.rpc('submit_trial_decision', {
			p_trial_id: trialId,
			p_decision: decision,
		});
		setBusyId(null);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(resolveTrialDecisionSuccessToast(decision));
		setTrials((prev) => applyTrialDecisionToList(prev, trialId, decision));
	}, []);

	const latest = resolveLatestTrial(trials);

	return { loading, latest, busyId, decide };
}
