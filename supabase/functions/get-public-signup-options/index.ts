// Public edge function: returns the data needed by the /aanmelden page
// for anonymous (not-logged-in) visitors. Uses service role to bypass RLS,
// but only returns minimal, non-sensitive fields.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface LessonTypeOut {
	id: string;
	name: string;
	icon: string;
	color: string;
	is_group_lesson: boolean;
}

interface LessonTypeOptionOut {
	id: string;
	lesson_type_id: string;
	duration_minutes: number;
	frequency: string;
	price_per_lesson: number;
}

interface GroupOut {
	id: string;
	lesson_type_id: string;
	name: string;
	day_of_week: number;
	start_time: string;
	duration_minutes: number;
	frequency: string;
	price_per_lesson: number;
	teacher_name: string | null;
	members_count: number;
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'GET' && req.method !== 'POST') {
		return new Response(JSON.stringify({ error: 'Method not allowed' }), {
			status: 405,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	const admin = createClient(
		Deno.env.get('SUPABASE_URL') ?? '',
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
	);

	const [lessonTypesRes, optionsRes, groupsRes] = await Promise.all([
		admin
			.from('lesson_types')
			.select('id, name, icon, color, is_group_lesson')
			.eq('is_active', true)
			.order('name'),
		admin
			.from('lesson_type_options')
			.select('id, lesson_type_id, duration_minutes, frequency, price_per_lesson')
			.order('duration_minutes')
			.order('frequency'),
		admin
			.from('lesson_groups')
			.select('id, lesson_type_id, name, day_of_week, start_time, duration_minutes, frequency, price_per_lesson, teacher_user_id')
			.eq('is_active', true),
	]);

	if (lessonTypesRes.error || optionsRes.error || groupsRes.error) {
		return new Response(
			JSON.stringify({ error: 'Failed to load signup options' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}

	const lessonTypes = (lessonTypesRes.data ?? []) as LessonTypeOut[];
	const options = (optionsRes.data ?? []) as LessonTypeOptionOut[];
	const rawGroups = (groupsRes.data ?? []) as Array<Omit<GroupOut, 'teacher_name' | 'members_count'> & { teacher_user_id: string }>;

	let groups: GroupOut[] = [];
	if (rawGroups.length > 0) {
		const teacherIds = [...new Set(rawGroups.map((g) => g.teacher_user_id))];
		const groupIds = rawGroups.map((g) => g.id);
		const [profilesRes, membersRes] = await Promise.all([
			admin.from('profiles').select('user_id, first_name, last_name').in('user_id', teacherIds),
			admin
				.from('lesson_group_members')
				.select('lesson_group_id')
				.in('lesson_group_id', groupIds)
				.is('left_date', null),
		]);
		const profileMap = new Map<string, { first_name: string | null; last_name: string | null }>(
			(profilesRes.data ?? []).map((p) => [p.user_id, { first_name: p.first_name, last_name: p.last_name }]),
		);
		const counts = new Map<string, number>();
		for (const m of membersRes.data ?? []) {
			counts.set(m.lesson_group_id, (counts.get(m.lesson_group_id) ?? 0) + 1);
		}
		groups = rawGroups.map((g) => {
			const p = profileMap.get(g.teacher_user_id);
			return {
				id: g.id,
				lesson_type_id: g.lesson_type_id,
				name: g.name,
				day_of_week: g.day_of_week,
				start_time: g.start_time,
				duration_minutes: g.duration_minutes,
				frequency: g.frequency,
				price_per_lesson: g.price_per_lesson,
				teacher_name: p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : null,
				members_count: counts.get(g.id) ?? 0,
			};
		});
	}

	return new Response(JSON.stringify({ lesson_types: lessonTypes, lesson_type_options: options, groups }), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
});
