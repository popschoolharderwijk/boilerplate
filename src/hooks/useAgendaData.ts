import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/components/agenda/types';
import { supabase } from '@/integrations/supabase/client';
import { generateAgendaEvents, type NoLessonPeriod } from '@/lib/agenda/eventGenerators';
import { buildParticipantInfo } from '@/lib/agenda/eventUtils';
import { getDisplayName } from '@/lib/display-name';
import type { AgendaEventDeviationRow, AgendaEventRow } from '@/types/agenda-events';
import type { LessonAgreementQuery, LessonAgreementWithStudent } from '@/types/lesson-agreements';
import type { ProjectInfo } from '@/types/projects';
import type { User } from '@/types/users';

export interface LessonAgreementWithTeacher extends LessonAgreementWithStudent {
	teacherUserId?: string;
	teacherProfile?: {
		first_name: string | null;
		last_name: string | null;
		email: string | null;
	} | null;
}

export interface LessonGroupInfo {
	id: string;
	name: string;
	lessonTypeName: string | null;
	lessonTypeIcon: string | null;
	lessonTypeColor: string | null;
	memberUserIds: string[];
}

export interface UseAgendaDataResult {
	agendaEvents: AgendaEventRow[];
	deviations: AgendaEventDeviationRow[];
	deviationsByEventId: Map<string, Map<string, AgendaEventDeviationRow>>;
	recurringByEventId: Map<string, AgendaEventDeviationRow[]>;
	agreementsMap: Map<string, LessonAgreementWithTeacher>;
	participantCountByEventId: Map<string, number>;
	participantNamesByEventId: Map<string, string[]>;
	projectsMap: Map<string, ProjectInfo>;
	lessonGroupsMap: Map<string, LessonGroupInfo>;
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
	const [participantCountByDeviationId, setParticipantCountByDeviationId] = useState<Map<string, number>>(new Map());
	const [participantNamesByDeviationId, setParticipantNamesByDeviationId] = useState<Map<string, string[]>>(
		new Map(),
	);
	const [agreements, setAgreements] = useState<LessonAgreementWithTeacher[]>([]);
	const [projectsMap, setProjectsMap] = useState<Map<string, ProjectInfo>>(new Map());
	const [lessonGroupsMap, setLessonGroupsMap] = useState<Map<string, LessonGroupInfo>>(new Map());
	const [profileMap, setProfileMap] = useState<Map<string, User>>(new Map());
	const [noLessonPeriods, setNoLessonPeriods] = useState<NoLessonPeriod[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(
		async (showLoading = true) => {
			if (!effectiveUserId) return;
			if (showLoading) setLoading(true);

			// Lesvrije periodes (vakanties) — leesbaar voor alle ingelogde gebruikers via RLS
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
				const list = userIdsByEvent.get(p.event_id) ?? [];
				list.push(p.user_id);
				userIdsByEvent.set(p.event_id, list);
			}
			setParticipantCountByEventId(countByEvent);

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
			const newLessonGroupsMap = new Map<string, LessonGroupInfo>(
				(lessonGroupsResult.data ?? []).map((g) => {
					const lt = Array.isArray(g.lesson_types) ? g.lesson_types[0] : g.lesson_types;
					const members = (g.lesson_group_members ?? [])
						.filter((m) => m.left_date === null)
						.map((m) => m.student_user_id);
					return [
						g.id,
						{
							id: g.id,
							name: g.name,
							lessonTypeName: lt?.name ?? null,
							lessonTypeIcon: lt?.icon ?? null,
							lessonTypeColor: lt?.color ?? null,
							memberUserIds: members,
						},
					] as const;
				}),
			);
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

			const withProfiles: LessonAgreementWithTeacher[] =
				agreementsError || agreementsData.length === 0
					? []
					: agreementsData.map((a) => {
							const teacherUserId = getTeacherUserId(a.teachers);
							const lessonType = normalizeLessonType(a.lesson_types);
							return {
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
							} satisfies LessonAgreementWithTeacher;
						});
			setAgreements(withProfiles);
			setLoading(false);
		},
		[effectiveUserId],
	);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const deviationsByEventId = useMemo(() => {
		const outer = new Map<string, Map<string, AgendaEventDeviationRow>>();
		for (const d of deviations) {
			let inner = outer.get(d.event_id);
			if (!inner) {
				inner = new Map();
				outer.set(d.event_id, inner);
			}
			inner.set(d.original_date, d);
		}
		return outer;
	}, [deviations]);

	const recurringByEventId = useMemo(() => {
		const map = new Map<string, AgendaEventDeviationRow[]>();
		for (const d of deviations) {
			if (!d.spans_future_occurrences) continue;
			const list = map.get(d.event_id) ?? [];
			list.push(d);
			map.set(d.event_id, list);
		}
		for (const list of map.values()) {
			list.sort((a, b) => b.original_date.localeCompare(a.original_date));
		}
		return map;
	}, [deviations]);

	const agreementsMap = useMemo(
		() => new Map<string, LessonAgreementWithTeacher>(agreements.map((a) => [a.id, a])),
		[agreements],
	);

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

			return baseEvents.map((ev) => {
				const deviationId = ev.resource.deviationId;
				const hasDeviationParticipants =
					deviationId &&
					(participantCountByDeviationId.has(deviationId) || participantNamesByDeviationId.has(deviationId));
				const participantCount =
					hasDeviationParticipants && deviationId
						? participantCountByDeviationId.get(deviationId)
						: ev.resource.eventId
							? participantCountByEventId.get(ev.resource.eventId)
							: undefined;
				const participantNames =
					hasDeviationParticipants && deviationId
						? participantNamesByDeviationId.get(deviationId)
						: ev.resource.eventId
							? participantNamesByEventId.get(ev.resource.eventId)
							: undefined;
				const enriched = {
					...ev,
					resource: {
						...ev.resource,
						participantCount,
						participantNames,
					},
				};

				if (ev.resource.sourceType === 'project' && ev.resource.agreementId) {
					const project = projectsMap.get(ev.resource.agreementId);
					if (project) {
						const appointmentTitle = (typeof ev.title === 'string' ? ev.title : '').trim();
						const displayTitle = appointmentTitle ? `${project.name} - ${appointmentTitle}` : project.name;
						return {
							...enriched,
							title: displayTitle,
							resource: {
								...enriched.resource,
								projectId: project.id,
								projectName: project.name,
								lessonTypeName: project.name,
								studentName: project.name,
							},
						};
					}
				}

				if (ev.resource.sourceType === 'lesson_group' && ev.resource.agreementId) {
					const group = lessonGroupsMap.get(ev.resource.agreementId);
					if (group) {
						const users = group.memberUserIds
							.map((uid) => profileMap.get(uid))
							.filter((p): p is User => !!p);
						const count = users.length || (participantCount ?? 0);
						const title = count > 0 ? `${group.name} (${count})` : group.name;
						const deviation =
							ev.resource.eventId && ev.resource.originalDate
								? deviationsByEventId.get(ev.resource.eventId)?.get(ev.resource.originalDate)
								: undefined;
						const cancelledParticipantIds = deviation?.cancelled_participant_ids ?? undefined;
						return {
							...enriched,
							title,
							resource: {
								...enriched.resource,
								lessonGroupId: group.id,
								lessonGroupName: group.name,
								lessonTypeName: group.lessonTypeName ?? group.name,
								lessonTypeColor: enriched.resource.color ?? group.lessonTypeColor,
								lessonTypeIcon: group.lessonTypeIcon,
								studentName: users.map((u) => getDisplayName(u)).join(', ') || group.name,
								isGroupLesson: true,
								studentCount: count,
								users,
								isLesson: true,
								cancelledParticipantIds,
							},
						};
					}
				}

				if (ev.resource.sourceType !== 'lesson_agreement' || !ev.resource.agreementId) return enriched;
				const agreement = agreementsMap.get(ev.resource.agreementId);
				if (!agreement) return enriched;
				const user = buildParticipantInfo(agreement.profiles, agreement.student_user_id);
				const studentName = getDisplayName(agreement.profiles);
				const teacherName = agreement.teacherProfile
					? getDisplayName(agreement.teacherProfile)
					: 'Docent onbekend';
				const viewerIsTeacher = viewerUserId === agreement.teacherUserId;
				return {
					...enriched,
					title: `${studentName} - ${agreement.lesson_types.name}`,
					resource: {
						...enriched.resource,
						studentName,
						teacherName,
						viewerIsTeacher,
						lessonTypeName: agreement.lesson_types.name,
						lessonTypeColor: agreement.lesson_types.color,
						lessonTypeIcon: agreement.lesson_types.icon,
						isGroupLesson: agreement.lesson_types.is_group_lesson ?? false,
						studentCount: agreement.lesson_types.is_group_lesson ? 1 : undefined,
						user: user ?? undefined,
						users: user ? [user] : undefined,
						isLesson: true,
					},
				};
			});
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
