import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ImportSummary {
	tab: string;
	created: number;
	updated: number;
	failed: number;
}

export async function saveLegacyMapping(
	admin: SupabaseClient,
	entity: string,
	legacyId: string,
	newId: string,
	importedBy: string | null,
): Promise<void> {
	const { error } = await admin
		.from('legacy_ids')
		.upsert(
			{ entity_type: entity, legacy_id: legacyId, new_id: newId, imported_by: importedBy },
			{ onConflict: 'entity_type,legacy_id' },
		);
	if (error) throw error;
}

export async function upsertMappedEntity<TPayload extends Record<string, unknown>>(options: {
	admin: SupabaseClient;
	table: string;
	entityType: string;
	legacyId: string;
	mapping: Map<string, string>;
	importedBy: string | null;
	payload: TPayload;
	summary: ImportSummary;
}): Promise<void> {
	const { admin, table, entityType, legacyId, mapping, importedBy, payload, summary } = options;
	const existingId = mapping.get(legacyId);
	if (existingId) {
		const { error } = await admin.from(table).update(payload).eq('id', existingId);
		if (error) throw error;
		summary.updated++;
		return;
	}

	const { data, error } = await admin.from(table).insert(payload).select('id').single();
	if (error) throw error;
	await saveLegacyMapping(admin, entityType, legacyId, data.id, importedBy);
	mapping.set(legacyId, data.id);
	summary.created++;
}

export async function upsertLegacyProfile(
	admin: SupabaseClient,
	userId: string,
	email: string,
	firstName: string | null,
	lastName: string | null,
	phone: string | null,
): Promise<void> {
	const { error } = await admin.from('profiles').upsert(
		{
			user_id: userId,
			email,
			first_name: firstName,
			last_name: lastName,
			phone_number: phone,
		},
		{ onConflict: 'user_id' },
	);
	if (error) throw error;
}

export async function upsertLegacyRole(
	admin: SupabaseClient,
	userId: string,
	role: 'student' | 'teacher',
): Promise<void> {
	const { error } = await admin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
	if (error) throw error;
}

export async function resolveLegacyPersonUserId(options: {
	admin: SupabaseClient;
	personMap: Map<string, string>;
	legacyId: string;
	email: string;
	firstName: string | null | undefined;
	lastName: string | null | undefined;
	phone: string | null | undefined;
	role: 'student' | 'teacher';
	ensureAuthUser: (
		admin: SupabaseClient,
		email: string,
		firstName: string | null | undefined,
		lastName: string | null | undefined,
	) => Promise<string>;
}): Promise<{ userId: string; created: boolean }> {
	const existingUserId = options.personMap.get(options.legacyId);
	const userId =
		existingUserId ??
		(await options.ensureAuthUser(options.admin, options.email, options.firstName, options.lastName));

	await upsertLegacyProfile(
		options.admin,
		userId,
		options.email,
		options.firstName ?? null,
		options.lastName ?? null,
		options.phone ?? null,
	);
	await upsertLegacyRole(options.admin, userId, options.role);

	return { userId, created: !existingUserId };
}
