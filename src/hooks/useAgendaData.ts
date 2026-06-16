import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/components/agenda/types';
import { supabase } from '@/integrations/supabase/client';
import { enrichAgendaEvent, type LessonGroupInfo } from '@/lib/agenda/enrichAgendaEvent';
import { generateAgendaEvents, type NoLessonPeriod } from '@/lib/agenda/eventGenerators';
import { pushToMapArray } from '@/lib/collections';
import { getDisplayName } from '@/lib/display-name';
import type { AgendaEventDeviationRow, AgendaEventRow } from '@/types/agenda-events';
import type { AgendaLessonAgreement, LessonAgreementQuery } from '@/types/lesson-agreements';
import type { ProjectInfo } from '@/types/projects';
import type { User } from '@/types/users';

export type { LessonGroupInfo } from '@/lib/agenda/enrichAgendaEvent';

export interface UseAgendaDataResult {
	agendaEvents: AgendaEventRow[];
	deviations: AgendaEventDeviationRow[];
	deviationsByEventId: Map<string, Map<string, AgendaEventDeviationRow>>;
	recurringByEventId: Map<string, AgendaEventDeviationRow[]>;
	agreementsMap: Map<string, AgendaLessonAgreement>;
	participantCountByEventId: Map<string, number>;
	participantNamesByEventId: Map<string, string[]>;
	projectsMap: Map<string, ProjectInfo>;
	lessonGroupsMap: Map<string, LessonGroupInfo>;
	noLessonPeriods: NoLessonPeriod[];
	loading: boolean;
	loadData: (showLoading?: boolean) => Promise<void>;
	getEnrichedEvents: (currentDate: Date, effectiveUserId: string | undefined) => CalendarEvent[];
}

function getTeacherUserId(teachers: { user_id: string }[] | null | undefined): string | undefined {
	return teachers?.[0]?.user_id;
}

function normalizeLessonType(
	lt: LessonAgreementQuery['lesson_types'],
): { id: string; name: string; icon: string | null; color: string | null; is_group_lesson: boolean | null } | null {
	if (!lt) return null;
	return Array.isArray(lt) ? (lt[0] ?? null) : lt;
}

export function useAgendaData(effectiveUserId: string | undefined): UseAgendaDataResult {
	const [agendaEvents, setAgendaEvents] = useState<AgendaEventRow[]>([]);
	const [deviations, setDeviations] = useState<AgendaEventDeviationRow[]>([]);
	const [participantCountByEventId, setParticipantCountByEventId] = useState<Map<string, number>>(new Map());
	const [participantNamesByEventId, setParticipantNamesByEventId] = useState<Map<string, string[]>>(new Map());
	const [participantUserIdsByEventId, setParticipantUserIdsByEventId] = useState<Map<string, string[]>>(new Map());
	const [participantCountByDeviationId, setParticipantCountByDeviationId] = useState<Map<string, number>>(new Map());
	const [participantNamesByDeviationId, setParticipantNamesByDeviationId] = useState<Map<string, string[]>>(
		new Map(),
	);
	const [agreements, setAgreements] = useState<AgendaLessonAgreement[]>([]);
	const [projectsMap, setProjectsMap] = useState<Map<string, ProjectInfo>>(new Map());
	const [lessonGroupsMap, setLessonGroupsMap] = useState<Map<string, LessonGroupInfo>>(new Map());
	const [profileMap, setProfileMap] = useState<Map<string, User>>(new Map());
	const [noLessonPeriods, setNoLessonPeriods] = useState<NoLessonPeriod[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(
		async (showLoading = true) => {
			if (!effectiveUserId) return;
			if (showLoading) setLoading(true);

			// No-lesson periods (holidays) — readable by all logged-in users via RLS
			const { data: noLessonData } = await supabase
				.from('no_lesson_periods')
				.select('start_date, end_date, name');
			setNoLessonPeriods(noLessonData ?? []);

			const { data: participantRows, error: partError } = await supabase
				.from('agenda_participants')
				.select('event_id')
				.eq('user_id', effectiveUserId);

			if (partError || !participantRows?.length) {
				setAgendaEvents([]);
				setDeviations([]);
				setParticipantCountByEventId(new Map());
				setParticipantNamesByEventId(new Map());
				setParticipantCountByDeviationId(new Map());
				setParticipantNamesByDeviationId(new Map());
				setAgreements([]);
				setProjectsMap(new Map());
				setLessonGroupsMap(new Map());
				setLoading(false);
				return;
			}

			const eventIds = [...new Set(participantRows.map((p) => p.event_id))];

			const [eventsResult, deviationsResult, participantsResult] = await Promise.all([
				supabase.from('agenda_events').select('*').in('id', eventIds),
				supabase.from('agenda_event_deviations').select('*').in('event_id', eventIds),
				supabase.from('agenda_participants').select('event_id, user_id').in('event_id', eventIds),
			]);

			const eventsError = eventsResult.error;
			const devError = deviationsResult.error;
			const eventsData = eventsResult.data;
			const devData = deviationsResult.data;
			const allParticipants = participantsResult.data ?? [];

			if (eventsError) {
				toast.error('Failed to load agenda events');
				setLoading(false);
				return;
			}
			if (devError) {
				toast.error('Failed to load deviations');
				setLoading(false);
				return;
			}

			const eventsList: AgendaEventRow[] = eventsData ?? [];
			const deviationsList: AgendaEventDeviationRow[] = devData ?? [];
			setAgendaEvents(eventsList);
			setDeviations(deviationsList);

			const countByEvent = new Map<string, number>();
			const userIdsByEvent = new Map<string, string[]>();
			for (const p of allParticipants) {
				countByEvent.set(p.event_id, (countByEvent.get(p.event_id) ?? 0) + 1);
				pushToMapArray(userIdsByEvent, p.event_id, p.user_id);
			}
			setParticipantCountByEventId(countByEvent);
			setParticipantUserIdsByEventId(userIdsByEvent);

			const deviationUserIds = [...new Set(deviationsList.flatMap((d) => d.participant_ids ?? []))];
			const lessonSourceIds = eventsList
				.filter(
					(e): e is AgendaEventRow & { source_id: string } =>
						e.source_type === 'lesson_agreement' && e.source_id != null,
				)
				.map((e) => e.source_id);

			// Fetch project info for project events
			const projectSourceIds = [
				...new Set(
					eventsList
						.filter(
							(e): e is AgendaEventRow & { source_id: string } =>
								e.source_type === 'project' && e.source_id != null,
						)
						.map((e) => e.source_id),
				),
			];

			// Fetch lesson group info for lesson_group events
			const lessonGroupSourceIds = [
				...new Set(
					eventsList
						.filter(
							(e): e is AgendaEventRow & { source_id: string } =>
								e.source_type === 'lesson_group' && e.source_id != null,
						)
						.map((e) => e.source_id),
				),
			];

			const [agreementsResult, projectsResult, lessonGroupsResult] = await Promise.all([
				lessonSourceIds.length > 0
					? supabase
							.from('lesson_agreements')
							.select(
								'id, day_of_week, start_time, start_date, end_date, is_active, student_user_id, lesson_type_id, duration_minutes, frequency, price_per_lesson, lesson_types(id, name, icon, color, is_group_lesson), teachers(user_id)',
							)
							.in('id', lessonSourceIds)
							.eq('is_active', true)
					: Promise.resolve({ data: [] as LessonAgreementQuery[], error: null }),
				projectSourceIds.length > 0
					? supabase.from('projects').select('id, name').in('id', projectSourceIds)
					: Promise.resolve<{ data: ProjectInfo[]; error: null }>({ data: [], error: null }),
				lessonGroupSourceIds.length > 0
					? supabase
							.from('lesson_groups')
							.select(
								'id, name, lesson_types(id, name, icon, color), lesson_group_members(student_user_id, left_date)',
							)
							.in('id', lessonGroupSourceIds)
					: Promise.resolve<{
							data: {
								id: string;
								name: string;
								lesson_types:
									| { id: string; name: string; icon: string | null; color: string | null }
									| { id: string; name: string; icon: string | null; color: string | null }[]
									| null;
								lesson_group_members: { student_user_id: string; left_date: string | null }[] | null;
							}[];
							error: null;
						}>({ data: [], error: null }),
			]);

			const agreementsData: LessonAgreementQuery[] = agreementsResult.data ?? [];
			const agreementsError = agreementsResult.error;

			// Build projects map
			const newProjectsMap = new Map<string, ProjectInfo>((projectsResult.data ?? []).map((p) => [p.id, p]));
			setProjectsMap(newProjectsMap);

			// Build lesson groups map
			const newLessonGroupsMap = new Map<string, LessonGroupInfo>();
			for (const g of lessonGroupsResult.data ?? []) {
				const lt = Array.isArray(g.lesson_types) ? g.lesson_types[0] : g.lesson_types;
				const members = (g.lesson_group_members ?? [])
					.filter((m) => m.left_date === null)
					.map((m) => m.student_user_id);
				newLessonGroupsMap.set(g.id, {
					id: g.id,
					name: g.name,
					lessonTypeName: lt?.name ?? null,
					lessonTypeIcon: lt?.icon ?? null,
					lessonTypeColor: lt?.color ?? null,
					memberUserIds: members,
				});
			}
			setLessonGroupsMap(newLessonGroupsMap);

			const studentUserIds =
				agreementsError || agreementsData.length === 0
					? []
					: [...new Set(agreementsData.map((a) => a.student_user_id))];
			const teacherUserIds =
				agreementsError || agreementsData.length === 0
					? []
					: [
							...new Set(
								agreementsData
									.map((a) => getTeacherUserId(a.teachers))
									.filter((id): id is string => !!id),
							),
						];
			const groupMemberIds = [...new Set([...newLessonGroupsMap.values()].flatMap((g) => g.memberUserIds))];
			const allProfileIds = [
				...new Set([
					...allParticipants.map((p) => p.user_id),
					...deviationUserIds,
					...studentUserIds,
					...teacherUserIds,
					...groupMemberIds,
				]),
			];

			const { data: profilesData } =
				allProfileIds.length > 0
					? await supabase
							.from('profiles')
							.select('user_id, first_name, last_name, email, avatar_url, phone_number')
							.in('user_id', allProfileIds)
					: { data: [] };

			const profilesList: User[] = profilesData ?? [];
			const profileMap = new Map<string, User>(profilesList.map((p) => [p.user_id, p]));
			setProfileMap(profileMap);

			const namesByEvent = new Map<string, string[]>();
			for (const [eventId, userIds] of userIdsByEvent) {
				if (userIds.length <= 1) continue;
				const names = userIds.map((uid) => getDisplayName(profileMap.get(uid))).sort();
				namesByEvent.set(eventId, names);
			}
			setParticipantNamesByEventId(namesByEvent);

			const countByDeviation = new Map<string, number>();
			const namesByDeviation = new Map<string, string[]>();
			for (const d of deviationsList) {
				const pids = d.participant_ids;
				if (pids && pids.length > 0) {
					countByDeviation.set(d.id, pids.length);
					const names = pids.map((uid) => getDisplayName(profileMap.get(uid))).sort();
					namesByDeviation.set(d.id, names);
				}
			}
			setParticipantCountByDeviationId(countByDeviation);
			setParticipantNamesByDeviationId(namesByDeviation);

			const agreementsWithProfiles: AgendaLessonAgreement[] = [];
			if (!agreementsError && agreementsData.length > 0) {
				for (const a of agreementsData) {
					const teacherUserId = getTeacherUserId(a.teachers);
					const lessonType = normalizeLessonType(a.lesson_types);
					agreementsWithProfiles.push({
						...a,
						profiles: profileMap.get(a.student_user_id) ?? null,
						lesson_types: lessonType ?? {
							id: '',
							name: '',
							icon: null,
							color: null,
							is_group_lesson: false,
						},
						teacherUserId,
						teacherProfile: teacherUserId ? (profileMap.get(teacherUserId) ?? null) : null,
					} satisfies AgendaLessonAgreement);
				}
			}
			setAgreements(agreementsWithProfiles);
			setLoading(false);
		},
		[effectiveUserId],
	);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const deviationsByEventId = new Map<string, Map<string, AgendaEventDeviationRow>>();
	for (const d of deviations) {
		let inner = deviationsByEventId.get(d.event_id);
		if (!inner) {
			inner = new Map();
			deviationsByEventId.set(d.event_id, inner);
		}
		inner.set(d.original_date, d);
	}

	const recurringByEventId = new Map<string, AgendaEventDeviationRow[]>();
	for (const d of deviations) {
		if (!d.spans_future_occurrences) continue;
		const list = recurringByEventId.get(d.event_id) ?? [];
		list.push(d);
		recurringByEventId.set(d.event_id, list);
	}
	for (const list of recurringByEventId.values()) {
		list.sort((a, b) => b.original_date.localeCompare(a.original_date));
	}

	const agreementsMap = new Map<string, AgendaLessonAgreement>(agreements.map((a) => [a.id, a]));

	const getEnrichedEvents = useCallback(
		(currentDate: Date, viewerUserId: string | undefined): CalendarEvent[] => {
			const startDate = new Date(currentDate);
			startDate.setMonth(startDate.getMonth() - 1);
			const endDate = new Date(currentDate);
			endDate.setMonth(endDate.getMonth() + 2);

			const baseEvents = generateAgendaEvents(
				agendaEvents,
				startDate,
				endDate,
				deviationsByEventId,
				recurringByEventId,
				agreementsMap,
				noLessonPeriods,
			);

			return baseEvents.map((ev) =>
				enrichAgendaEvent(ev, {
					participantCountByEventId,
					participantNamesByEventId,
					participantUserIdsByEventId,
					participantCountByDeviationId,
					participantNamesByDeviationId,
					projectsMap,
					lessonGroupsMap,
					agreementsMap,
					deviationsByEventId,
					profileMap,
					viewerUserId,
				}),
			);
		},
		[
			agendaEvents,
			deviationsByEventId,
			recurringByEventId,
			agreementsMap,
			projectsMap,
			lessonGroupsMap,
			participantCountByEventId,
			participantNamesByEventId,
			participantUserIdsByEventId,
			participantCountByDeviationId,
			participantNamesByDeviationId,
			profileMap,
			noLessonPeriods,
		],
	);

	return {
		agendaEvents,
		deviations,
		deviationsByEventId,
		recurringByEventId,
		agreementsMap,
		participantCountByEventId,
		participantNamesByEventId,
		projectsMap,
		lessonGroupsMap,
		noLessonPeriods,
		loading,
		loadData,
		getEnrichedEvents,
	};
}
