import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_DEFAULT_KEY = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const USERS = {
	site_admin: '00000000-0000-0000-0000-000000000001',

	admin_1: '00000000-0000-0000-0000-000000000010',
	admin_2: '00000000-0000-0000-0000-000000000011',

	staff: '00000000-0000-0000-0000-000000000020',

	teacher_alice: '00000000-0000-0000-0000-000000000030',
	teacher_bob: '00000000-0000-0000-0000-000000000031',

	student_a: '00000000-0000-0000-0000-000000000100',
	student_b: '00000000-0000-0000-0000-000000000101',
	student_c: '00000000-0000-0000-0000-000000000102',
	student_d: '00000000-0000-0000-0000-000000000103',
} as const;

export type TestUser = keyof typeof USERS | 'anon';

export function impersonate(user: TestUser): SupabaseClient {
	if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
		throw new Error('Missing keys');
	}
	return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
		global: {
			headers:
				user === 'anon'
					? {
							'x-supabase-impersonate-role': 'anon',
						}
					: {
							'x-supabase-impersonate-user-id': USERS[user],
							'x-supabase-impersonate-role': 'authenticated',
						},
		},
	});
}
