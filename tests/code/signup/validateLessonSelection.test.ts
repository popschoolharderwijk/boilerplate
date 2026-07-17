import { describe, expect, it } from 'bun:test';
import type { SignupRequest } from '../../../supabase/functions/submit-signup-request/types';
import { validateLessonSelection } from '../../../supabase/functions/submit-signup-request/validateLessonSelection';

const LESSON_TYPE_ID = '11111111-1111-1111-1111-111111111111';
const LESSON_GROUP_ID = '22222222-2222-2222-2222-222222222222';
const LESSON_OPTION_ID = '33333333-3333-3333-3333-333333333333';

type TableData = Record<string, { data: unknown; error: null }>;

function createSupabaseMock(tables: TableData) {
	return {
		from: (table: string) => ({
			select: () => ({
				eq: () => ({
					single: () => Promise.resolve(tables[table] ?? { data: null, error: null }),
				}),
			}),
		}),
	} as unknown as Parameters<typeof validateLessonSelection>[0];
}

const baseBody: SignupRequest = {
	lesson_type_id: LESSON_TYPE_ID,
	first_name: 'Anna',
	last_name: 'Bakker',
	email: 'anna@example.com',
};

async function readError(response: Response): Promise<string> {
	const body = (await response.json()) as { error: string };
	return body.error;
}

describe('validateLessonSelection', () => {
	it('accepts an active individual lesson type without option or group', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: false },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, baseBody);
		expect(result).toEqual({
			ok: true,
			lessonType: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: false },
			optionId: null,
		});
	});

	it('rejects inactive lesson types', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: false, is_group_lesson: false },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, baseBody);
		expect(result.ok).toBe(false);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe(
			'Lessoort niet beschikbaar',
		);
	});

	it('accepts an active matching lesson group', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: true },
				error: null,
			},
			lesson_groups: {
				data: { id: LESSON_GROUP_ID, lesson_type_id: LESSON_TYPE_ID, is_active: true },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, {
			...baseBody,
			lesson_group_id: LESSON_GROUP_ID,
		});
		expect(result.ok).toBe(true);
	});

	it('rejects inactive or mismatched lesson groups', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: true },
				error: null,
			},
			lesson_groups: {
				data: { id: LESSON_GROUP_ID, lesson_type_id: 'other-type', is_active: true },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, {
			...baseBody,
			lesson_group_id: LESSON_GROUP_ID,
		});
		expect(result.ok).toBe(false);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe('Groep niet beschikbaar');
	});

	it('rejects lesson type options on group lessons', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: true },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, {
			...baseBody,
			lesson_type_option_id: LESSON_OPTION_ID,
		});
		expect(result.ok).toBe(false);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe(
			'Optie niet toegestaan voor groepsles',
		);
	});

	it('accepts a matching lesson type option for individual lessons', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: false },
				error: null,
			},
			lesson_type_options: {
				data: { id: LESSON_OPTION_ID, lesson_type_id: LESSON_TYPE_ID },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, {
			...baseBody,
			lesson_type_option_id: LESSON_OPTION_ID,
		});
		expect(result).toEqual({
			ok: true,
			lessonType: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: false },
			optionId: LESSON_OPTION_ID,
		});
	});

	it('rejects lesson type options that do not belong to the lesson type', async () => {
		const supabase = createSupabaseMock({
			lesson_types: {
				data: { id: LESSON_TYPE_ID, is_active: true, is_group_lesson: false },
				error: null,
			},
			lesson_type_options: {
				data: { id: LESSON_OPTION_ID, lesson_type_id: 'other-type' },
				error: null,
			},
		});

		const result = await validateLessonSelection(supabase, {
			...baseBody,
			lesson_type_option_id: LESSON_OPTION_ID,
		});
		expect(result.ok).toBe(false);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe('Optie niet beschikbaar');
	});
});
