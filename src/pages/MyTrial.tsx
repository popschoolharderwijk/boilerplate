import { useEffect, useState } from 'react';
import { LuCheck, LuGraduationCap, LuX } from 'react-icons/lu';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatDbDateLong } from '@/lib/date/date-format';

type Trial = Tables<'trial_lessons'> & {
	teacher_name: string;
	lesson_type_name: string | null;
};

const STATUS_LABEL: Record<string, string> = {
	scheduled: 'Ingepland',
	completed: 'Gegeven',
	cancelled: 'Geannuleerd',
	student_confirmed: 'Doorgegeven: ik wil doorgaan',
	student_declined: 'Doorgegeven: ik stop',
	converted: 'Overeenkomst gemaakt',
};

export default function MyTrial() {
	const { user, isLoading } = useAuth();
	const [trials, setTrials] = useState<Trial[]>([]);
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		if (!user) return;
		(async () => {
			setLoading(true);
			const { data } = await supabase
				.from('trial_lessons')
				.select('*')
				.eq('student_user_id', user.id)
				.order('scheduled_date', { ascending: false });
			const list = data ?? [];
			const teacherIds = Array.from(new Set(list.map((t) => t.teacher_user_id)));
			const lessonTypeIds = Array.from(new Set(list.map((t) => t.lesson_type_id)));
			const [{ data: profs }, { data: lts }] = await Promise.all([
				teacherIds.length
					? supabase
							.from('profiles')
							.select('user_id, first_name, last_name, email')
							.in('user_id', teacherIds)
					: Promise.resolve({ data: [] as { user_id: string; first_name: string | null; last_name: string | null; email: string }[] }),
				lessonTypeIds.length
					? supabase.from('lesson_types').select('id, name').in('id', lessonTypeIds)
					: Promise.resolve({ data: [] as { id: string; name: string }[] }),
			]);
			const profMap = new Map(profs?.map((p) => [p.user_id, p]) ?? []);
			const ltMap = new Map(lts?.map((l) => [l.id, l.name]) ?? []);
			setTrials(
				list.map((t) => {
					const tp = profMap.get(t.teacher_user_id);
					return {
						...t,
						teacher_name: tp
							? [tp.first_name, tp.last_name].filter(Boolean).join(' ') || tp.email
							: '—',
						lesson_type_name: ltMap.get(t.lesson_type_id) ?? null,
					};
				}),
			);
			setLoading(false);
		})();
	}, [user]);

	const decide = async (trialId: string, decision: 'confirm' | 'decline') => {
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
		toast.success(decision === 'confirm' ? 'Bedankt! We nemen contact op.' : 'Bedankt voor je terugkoppeling.');
		setTrials((prev) =>
			prev.map((t) =>
				t.id === trialId
					? { ...t, status: decision === 'confirm' ? 'student_confirmed' : 'student_declined' }
					: t,
			),
		);
	};

	if (isLoading) return null;
	if (!user) return <Navigate to="/login" replace />;

	const latest = trials[0];

	return (
		<>
			<PageHeader
				icon={<LuGraduationCap className="h-6 w-6" />}
				title="Mijn proefles"
				subtitle="Bekijk je proefles en geef aan of je verder wilt"
			/>
			<div className="mt-6 max-w-xl">
				{loading && <p className="text-sm text-muted-foreground">Laden…</p>}
				{!loading && !latest && (
					<p className="text-sm text-muted-foreground">
						Je hebt momenteel geen proefles ingepland. Neem contact op met de school als je een proefles
						wilt doen.
					</p>
				)}
				{!loading && latest && (
					<div className="rounded-lg border bg-card p-6 space-y-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-lg font-semibold">{latest.lesson_type_name ?? 'Proefles'}</div>
								<div className="text-sm text-muted-foreground">Docent: {latest.teacher_name}</div>
							</div>
							<Badge variant="secondary">{STATUS_LABEL[latest.status] ?? latest.status}</Badge>
						</div>
						<div className="text-sm">
							<div>
								<strong>Datum:</strong> {formatDbDateLong(latest.scheduled_date)}
							</div>
							<div>
								<strong>Tijd:</strong> {latest.scheduled_start_time.slice(0, 5)} ({latest.duration_minutes}{' '}
								min)
							</div>
						</div>

						{(latest.status === 'scheduled' || latest.status === 'completed') && (
							<div className="space-y-2 pt-2 border-t">
								<p className="text-sm font-medium">Wil je doorgaan met lessen?</p>
								<div className="flex gap-2">
									<Button onClick={() => decide(latest.id, 'confirm')} disabled={busyId === latest.id}>
										<LuCheck className="h-4 w-4 mr-1" /> Ja, ik wil doorgaan
									</Button>
									<Button
										variant="outline"
										onClick={() => decide(latest.id, 'decline')}
										disabled={busyId === latest.id}
									>
										<LuX className="h-4 w-4 mr-1" /> Nee, bedankt
									</Button>
								</div>
							</div>
						)}

						{latest.status === 'student_confirmed' && (
							<p className="text-sm text-muted-foreground">
								Bedankt! De school maakt nu een overeenkomst voor je en stuurt je de betaaluitnodiging.
							</p>
						)}
					</div>
				)}
			</div>
		</>
	);
}
