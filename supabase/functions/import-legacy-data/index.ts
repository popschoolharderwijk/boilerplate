// Edge function: legacy data import.
// Actions: template | validate | import.
// Only admins / site_admins.
// Idempotent via public.legacy_ids mapping table.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';
import { z } from 'npm:zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';
import { getSafeErrorMessage } from '../_shared/errors.ts';
import { resolveLegacyPersonUserId, saveLegacyMapping, upsertMappedEntity } from '../_shared/legacy-import.ts';

type Action = 'template' | 'validate' | 'import';

interface Body {
	action: Action;
	file_base64?: string;
}

const FREQ = z.enum(['daily', 'weekly', 'biweekly', 'monthly']);

const lessonTypeSchema = z.object({
	legacy_id: z.string().min(1),
	name: z.string().min(1),
	icon: z.string().min(1),
	color: z.string().min(1),
	is_group_lesson: z.coerce.boolean().optional().default(false),
	cost_center: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	is_active: z.coerce.boolean().optional().default(true),
});

const lessonTypeOptionSchema = z.object({
	legacy_id: z.string().min(1),
	lesson_type_legacy_id: z.string().min(1),
	frequency: FREQ,
	duration_minutes: z.coerce.number().int().positive(),
	price_per_lesson: z.coerce.number().nonnegative(),
	price_per_lesson_adult_cents: z.coerce.number().int().nonnegative().optional().nullable(),
	price_per_lesson_under_21_cents: z.coerce.number().int().nonnegative().optional().nullable(),
});

const personLegacySchema = z.object({
	legacy_id: z.string().min(1),
	email: z.string().email(),
	first_name: z.string().optional().nullable(),
	last_name: z.string().optional().nullable(),
	phone_number: z.string().optional().nullable(),
});

const teacherSchema = personLegacySchema.extend({
	bio: z.string().optional().nullable(),
	is_active: z.coerce.boolean().optional().default(true),
	lesson_type_legacy_ids: z.string().optional().nullable(), // pipe-separated
});

const studentSchema = personLegacySchema.extend({
	date_of_birth: z.string().optional().nullable(),
	parent_name: z.string().optional().nullable(),
	parent_email: z.string().email().optional().nullable().or(z.literal('')),
	parent_phone_number: z.string().optional().nullable(),
	debtor_info_same_as_student: z.coerce.boolean().optional().default(true),
	debtor_name: z.string().optional().nullable(),
	debtor_address: z.string().optional().nullable(),
	debtor_postal_code: z.string().optional().nullable(),
	debtor_city: z.string().optional().nullable(),
});

const agreementSchema = z.object({
	legacy_id: z.string().min(1),
	student_legacy_id: z.string().min(1),
	teacher_legacy_id: z.string().min(1),
	lesson_type_legacy_id: z.string().min(1),
	duration_minutes: z.coerce.number().int().positive(),
	frequency: FREQ,
	price_per_lesson: z.coerce.number().nonnegative(),
	day_of_week: z.coerce.number().int().min(0).max(6),
	start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	end_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
		.nullable()
		.or(z.literal('')),
	notes: z.string().optional().nullable(),
	signup_source: z.string().optional().nullable(),
});

const TABS = ['lesson_types', 'lesson_type_options', 'teachers', 'students', 'lesson_agreements'] as const;
type Tab = (typeof TABS)[number];

interface RowError {
	tab: Tab;
	row: number;
	field?: string;
	message: string;
}

interface ImportSummary {
	tab: Tab;
	created: number;
	updated: number;
	failed: number;
}

function json(body: unknown, status = 200, extra: HeadersInit = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extra },
	});
}

function base64ToUint8Array(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function sheetRows(wb: XLSX.WorkBook, name: string): Record<string, unknown>[] {
	const sheet = wb.Sheets[name];
	if (!sheet) return [];
	return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

function buildTemplate(): Uint8Array {
	const wb = XLSX.utils.book_new();
	const headers: Record<Tab, string[]> = {
		lesson_types: [
			'legacy_id',
			'name',
			'icon',
			'color',
			'is_group_lesson',
			'cost_center',
			'description',
			'is_active',
		],
		lesson_type_options: [
			'legacy_id',
			'lesson_type_legacy_id',
			'frequency',
			'duration_minutes',
			'price_per_lesson',
			'price_per_lesson_adult_cents',
			'price_per_lesson_under_21_cents',
		],
		teachers: [
			'legacy_id',
			'email',
			'first_name',
			'last_name',
			'phone_number',
			'bio',
			'is_active',
			'lesson_type_legacy_ids',
		],
		students: [
			'legacy_id',
			'email',
			'first_name',
			'last_name',
			'phone_number',
			'date_of_birth',
			'parent_name',
			'parent_email',
			'parent_phone_number',
			'debtor_info_same_as_student',
			'debtor_name',
			'debtor_address',
			'debtor_postal_code',
			'debtor_city',
		],
		lesson_agreements: [
			'legacy_id',
			'student_legacy_id',
			'teacher_legacy_id',
			'lesson_type_legacy_id',
			'duration_minutes',
			'frequency',
			'price_per_lesson',
			'day_of_week',
			'start_time',
			'start_date',
			'end_date',
			'notes',
			'signup_source',
		],
	};
	for (const tab of TABS) {
		const ws = XLSX.utils.aoa_to_sheet([headers[tab]]);
		XLSX.utils.book_append_sheet(wb, ws, tab);
	}
	return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

function validateWorkbook(wb: XLSX.WorkBook): { rows: Record<Tab, unknown[]>; errors: RowError[] } {
	const errors: RowError[] = [];
	const out: Record<Tab, unknown[]> = {
		lesson_types: [],
		lesson_type_options: [],
		teachers: [],
		students: [],
		lesson_agreements: [],
	};
	const schemas: Record<Tab, z.ZodSchema> = {
		lesson_types: lessonTypeSchema,
		lesson_type_options: lessonTypeOptionSchema,
		teachers: teacherSchema,
		students: studentSchema,
		lesson_agreements: agreementSchema,
	};
	for (const tab of TABS) {
		const raw = sheetRows(wb, tab);
		raw.forEach((row, idx) => {
			const result = schemas[tab].safeParse(row);
			if (result.success) {
				out[tab].push(result.data);
			} else {
				for (const issue of result.error.issues) {
					errors.push({
						tab,
						row: idx + 2, // header on row 1, data starts row 2
						field: issue.path.join('.'),
						message: issue.message,
					});
				}
			}
		});
	}
	// Cross-tab referential checks
	const lessonTypeIds = new Set((out.lesson_types as { legacy_id: string }[]).map((x) => x.legacy_id));
	const teacherIds = new Set((out.teachers as { legacy_id: string }[]).map((x) => x.legacy_id));
	const studentIds = new Set((out.students as { legacy_id: string }[]).map((x) => x.legacy_id));
	(out.lesson_type_options as { lesson_type_legacy_id: string }[]).forEach((row, idx) => {
		if (!lessonTypeIds.has(row.lesson_type_legacy_id)) {
			errors.push({
				tab: 'lesson_type_options',
				row: idx + 2,
				field: 'lesson_type_legacy_id',
				message: `Onbekende lesson_type_legacy_id: ${row.lesson_type_legacy_id}`,
			});
		}
	});
	(
		out.lesson_agreements as {
			student_legacy_id: string;
			teacher_legacy_id: string;
			lesson_type_legacy_id: string;
		}[]
	).forEach((row, idx) => {
		if (!studentIds.has(row.student_legacy_id))
			errors.push({ tab: 'lesson_agreements', row: idx + 2, field: 'student_legacy_id', message: 'Onbekend' });
		if (!teacherIds.has(row.teacher_legacy_id))
			errors.push({ tab: 'lesson_agreements', row: idx + 2, field: 'teacher_legacy_id', message: 'Onbekend' });
		if (!lessonTypeIds.has(row.lesson_type_legacy_id))
			errors.push({
				tab: 'lesson_agreements',
				row: idx + 2,
				field: 'lesson_type_legacy_id',
				message: 'Onbekend',
			});
	});
	return { rows: out, errors };
}

// ---------- Legacy mapping helpers ----------

async function getMapping(admin: SupabaseClient, entity: string): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	const { data, error } = await admin.from('legacy_ids').select('legacy_id, new_id').eq('entity_type', entity);
	if (error) throw error;
	for (const r of data ?? []) map.set(r.legacy_id, r.new_id);
	return map;
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
	// Iterate pages — small workspaces, fine for first import.
	const perPage = 1000;
	for (let page = 1; page <= 20; page++) {
		const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
		if (error) throw error;
		const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
		if (found) return found.id;
		if (data.users.length < perPage) return null;
	}
	return null;
}

// ---------- Import per entity ----------

async function importLessonTypes(
	admin: SupabaseClient,
	rows: z.infer<typeof lessonTypeSchema>[],
	mapping: Map<string, string>,
	importedBy: string | null,
	errors: RowError[],
): Promise<ImportSummary> {
	const summary: ImportSummary = { tab: 'lesson_types', created: 0, updated: 0, failed: 0 };
	for (const [i, row] of rows.entries()) {
		try {
			await upsertMappedEntity({
				admin,
				table: 'lesson_types',
				entityType: 'lesson_type',
				legacyId: row.legacy_id,
				mapping,
				importedBy,
				payload: {
					name: row.name,
					icon: row.icon,
					color: row.color,
					is_group_lesson: row.is_group_lesson ?? false,
					cost_center: row.cost_center ?? null,
					description: row.description ?? null,
					is_active: row.is_active ?? true,
				},
				summary,
			});
		} catch (err) {
			summary.failed++;
			errors.push({ tab: 'lesson_types', row: i + 2, message: getSafeErrorMessage(err) });
		}
	}
	return summary;
}

async function importLessonTypeOptions(
	admin: SupabaseClient,
	rows: z.infer<typeof lessonTypeOptionSchema>[],
	typeMap: Map<string, string>,
	mapping: Map<string, string>,
	importedBy: string | null,
	errors: RowError[],
): Promise<ImportSummary> {
	const summary: ImportSummary = { tab: 'lesson_type_options', created: 0, updated: 0, failed: 0 };
	for (const [i, row] of rows.entries()) {
		try {
			const lessonTypeId = typeMap.get(row.lesson_type_legacy_id);
			if (!lessonTypeId) throw new Error(`Geen lesson_type voor ${row.lesson_type_legacy_id}`);
			const payload = {
				lesson_type_id: lessonTypeId,
				frequency: row.frequency,
				duration_minutes: row.duration_minutes,
				price_per_lesson: row.price_per_lesson,
				price_per_lesson_adult_cents: row.price_per_lesson_adult_cents ?? null,
				price_per_lesson_under_21_cents: row.price_per_lesson_under_21_cents ?? null,
			};
			await upsertMappedEntity({
				admin,
				table: 'lesson_type_options',
				entityType: 'lesson_type_option',
				legacyId: row.legacy_id,
				mapping,
				importedBy,
				payload,
				summary,
			});
		} catch (err) {
			summary.failed++;
			errors.push({ tab: 'lesson_type_options', row: i + 2, message: getSafeErrorMessage(err) });
		}
	}
	return summary;
}

async function ensureAuthUser(
	admin: SupabaseClient,
	email: string,
	firstName: string | null | undefined,
	lastName: string | null | undefined,
): Promise<string> {
	const { data: created, error } = await admin.auth.admin.createUser({
		email,
		email_confirm: true,
		user_metadata: { first_name: firstName ?? null, last_name: lastName ?? null },
	});
	if (created?.user) return created.user.id;
	if (error && (error.message.includes('already') || error.message.includes('exists'))) {
		const existing = await findAuthUserByEmail(admin, email);
		if (existing) return existing;
	}
	throw error ?? new Error('Gebruiker kon niet worden aangemaakt');
}

async function importTeachers(
	admin: SupabaseClient,
	rows: z.infer<typeof teacherSchema>[],
	teacherMap: Map<string, string>,
	typeMap: Map<string, string>,
	importedBy: string | null,
	errors: RowError[],
): Promise<ImportSummary> {
	const summary: ImportSummary = { tab: 'teachers', created: 0, updated: 0, failed: 0 };
	for (const [i, row] of rows.entries()) {
		try {
			const hadMapping = teacherMap.has(row.legacy_id);
			const { userId } = await resolveLegacyPersonUserId({
				admin,
				personMap: teacherMap,
				legacyId: row.legacy_id,
				email: row.email,
				firstName: row.first_name,
				lastName: row.last_name,
				phone: row.phone_number,
				role: 'teacher',
				ensureAuthUser,
			});
			const { error: tErr } = await admin
				.from('teachers')
				.upsert(
					{ user_id: userId, bio: row.bio ?? null, is_active: row.is_active ?? true },
					{ onConflict: 'user_id' },
				);
			if (tErr) throw tErr;
			// Lesson type links
			if (row.lesson_type_legacy_ids) {
				const wantedLegacyIds = row.lesson_type_legacy_ids
					.split('|')
					.map((s) => s.trim())
					.filter(Boolean);
				for (const lid of wantedLegacyIds) {
					const ltId = typeMap.get(lid);
					if (!ltId) {
						errors.push({
							tab: 'teachers',
							row: i + 2,
							field: 'lesson_type_legacy_ids',
							message: `Onbekend: ${lid}`,
						});
						continue;
					}
					await admin
						.from('teacher_lesson_types')
						.upsert(
							{ teacher_user_id: userId, lesson_type_id: ltId },
							{ onConflict: 'teacher_user_id,lesson_type_id' },
						);
				}
			}
			if (!hadMapping) {
				await saveLegacyMapping(admin, 'teacher', row.legacy_id, userId, importedBy);
				teacherMap.set(row.legacy_id, userId);
				summary.created++;
			} else {
				summary.updated++;
			}
		} catch (err) {
			summary.failed++;
			errors.push({ tab: 'teachers', row: i + 2, message: getSafeErrorMessage(err) });
		}
	}
	return summary;
}

async function importStudents(
	admin: SupabaseClient,
	rows: z.infer<typeof studentSchema>[],
	studentMap: Map<string, string>,
	importedBy: string | null,
	errors: RowError[],
): Promise<ImportSummary> {
	const summary: ImportSummary = { tab: 'students', created: 0, updated: 0, failed: 0 };
	for (const [i, row] of rows.entries()) {
		try {
			const hadMapping = studentMap.has(row.legacy_id);
			const { userId } = await resolveLegacyPersonUserId({
				admin,
				personMap: studentMap,
				legacyId: row.legacy_id,
				email: row.email,
				firstName: row.first_name,
				lastName: row.last_name,
				phone: row.phone_number,
				role: 'student',
				ensureAuthUser,
			});
			const { error: sErr } = await admin.from('students').upsert(
				{
					user_id: userId,
					date_of_birth: row.date_of_birth ?? null,
					parent_name: row.parent_name ?? null,
					parent_email: row.parent_email && row.parent_email !== '' ? row.parent_email : null,
					parent_phone_number: row.parent_phone_number ?? null,
					debtor_info_same_as_student: row.debtor_info_same_as_student ?? true,
					debtor_name: row.debtor_name ?? null,
					debtor_address: row.debtor_address ?? null,
					debtor_postal_code: row.debtor_postal_code ?? null,
					debtor_city: row.debtor_city ?? null,
				},
				{ onConflict: 'user_id' },
			);
			if (sErr) throw sErr;
			if (!hadMapping) {
				await saveLegacyMapping(admin, 'student', row.legacy_id, userId, importedBy);
				studentMap.set(row.legacy_id, userId);
				summary.created++;
			} else {
				summary.updated++;
			}
		} catch (err) {
			summary.failed++;
			errors.push({ tab: 'students', row: i + 2, message: getSafeErrorMessage(err) });
		}
	}
	return summary;
}

async function importAgreements(
	admin: SupabaseClient,
	rows: z.infer<typeof agreementSchema>[],
	agreementMap: Map<string, string>,
	studentMap: Map<string, string>,
	teacherMap: Map<string, string>,
	typeMap: Map<string, string>,
	importedBy: string | null,
	errors: RowError[],
): Promise<ImportSummary> {
	const summary: ImportSummary = { tab: 'lesson_agreements', created: 0, updated: 0, failed: 0 };
	for (const [i, row] of rows.entries()) {
		try {
			const studentId = studentMap.get(row.student_legacy_id);
			const teacherId = teacherMap.get(row.teacher_legacy_id);
			const typeId = typeMap.get(row.lesson_type_legacy_id);
			if (!studentId || !teacherId || !typeId)
				throw new Error('Onbekende referentie (student/teacher/lesson_type)');
			const payload = {
				student_user_id: studentId,
				teacher_user_id: teacherId,
				lesson_type_id: typeId,
				duration_minutes: row.duration_minutes,
				frequency: row.frequency,
				price_per_lesson: row.price_per_lesson,
				day_of_week: row.day_of_week,
				start_time: row.start_time.length === 5 ? `${row.start_time}:00` : row.start_time,
				start_date: row.start_date,
				end_date: row.end_date && row.end_date !== '' ? row.end_date : null,
				notes: row.notes ?? null,
				signup_source: row.signup_source ?? 'legacy-import',
				is_active: true,
			};
			await upsertMappedEntity({
				admin,
				table: 'lesson_agreements',
				entityType: 'lesson_agreement',
				legacyId: row.legacy_id,
				mapping: agreementMap,
				importedBy,
				payload,
				summary,
			});
		} catch (err) {
			summary.failed++;
			errors.push({ tab: 'lesson_agreements', row: i + 2, message: getSafeErrorMessage(err) });
		}
	}
	return summary;
}

// ---------- HTTP handler ----------

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
		const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
		const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
		const authHeader = req.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

		const userClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authHeader } },
			auth: { autoRefreshToken: false, persistSession: false },
		});
		const {
			data: { user },
			error: authErr,
		} = await userClient.auth.getUser();
		if (authErr || !user) return json({ error: 'Invalid token' }, 401);

		const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
		if (!roleRow || (roleRow.role !== 'admin' && roleRow.role !== 'site_admin')) {
			return json({ error: 'Geen rechten voor data-import' }, 403);
		}

		const body: Body = req.method === 'GET' ? { action: 'template' } : await req.json();
		const action = body.action;

		if (action === 'template') {
			const bytes = buildTemplate();
			return new Response(bytes, {
				headers: {
					...corsHeaders,
					'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'Content-Disposition': 'attachment; filename="legacy-import-template.xlsx"',
				},
			});
		}

		if (action !== 'validate' && action !== 'import') return json({ error: 'Onbekende action' }, 400);
		if (!body.file_base64) return json({ error: 'file_base64 ontbreekt' }, 400);

		const wb = XLSX.read(base64ToUint8Array(body.file_base64), { type: 'array' });
		const { rows, errors } = validateWorkbook(wb);

		const counts = Object.fromEntries(TABS.map((t) => [t, (rows[t] as unknown[]).length])) as Record<Tab, number>;

		if (action === 'validate') return json({ ok: errors.length === 0, errors, counts });

		if (errors.length > 0) return json({ error: 'Validatie faalt; fix eerst', errors }, 400);

		const admin = createClient(supabaseUrl, serviceKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		const typeMap = await getMapping(admin, 'lesson_type');
		const optionMap = await getMapping(admin, 'lesson_type_option');
		const teacherMap = await getMapping(admin, 'teacher');
		const studentMap = await getMapping(admin, 'student');
		const agreementMap = await getMapping(admin, 'lesson_agreement');

		const importErrors: RowError[] = [];
		const summaries: ImportSummary[] = [];
		summaries.push(
			await importLessonTypes(
				admin,
				rows.lesson_types as z.infer<typeof lessonTypeSchema>[],
				typeMap,
				user.id,
				importErrors,
			),
		);
		summaries.push(
			await importLessonTypeOptions(
				admin,
				rows.lesson_type_options as z.infer<typeof lessonTypeOptionSchema>[],
				typeMap,
				optionMap,
				user.id,
				importErrors,
			),
		);
		summaries.push(
			await importTeachers(
				admin,
				rows.teachers as z.infer<typeof teacherSchema>[],
				teacherMap,
				typeMap,
				user.id,
				importErrors,
			),
		);
		summaries.push(
			await importStudents(
				admin,
				rows.students as z.infer<typeof studentSchema>[],
				studentMap,
				user.id,
				importErrors,
			),
		);
		summaries.push(
			await importAgreements(
				admin,
				rows.lesson_agreements as z.infer<typeof agreementSchema>[],
				agreementMap,
				studentMap,
				teacherMap,
				typeMap,
				user.id,
				importErrors,
			),
		);

		return json({ ok: importErrors.length === 0, summaries, errors: importErrors, counts });
	} catch (err) {
		console.error('[import-legacy-data]', err);
		return json({ error: getSafeErrorMessage(err) }, 500);
	}
});
