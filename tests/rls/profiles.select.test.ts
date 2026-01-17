import { describe, expect, it } from 'bun:test';
import { impersonate } from './impersonation';

describe('RLS: profiles SELECT', () => {
	it('student sees only own profile', async () => {
		const db = impersonate('student_a');
		const { data, error } = await db.from('profiles').select('*');

		console.log(data, error);

		expect(error).toBeNull();
		expect(data?.length).toBe(1);
	});
});
