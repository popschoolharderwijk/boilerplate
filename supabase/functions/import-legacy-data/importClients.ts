import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function createLegacyImportAdminClient(supabaseUrl: string, serviceKey: string): SupabaseClient {
	return createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

export function createLegacyImportUserClient(supabaseUrl: string, anonKey: string, authHeader: string): SupabaseClient {
	return createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
}
