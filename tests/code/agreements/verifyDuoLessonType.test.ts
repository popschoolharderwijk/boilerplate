import { describe, expect, it } from 'bun:test';
import { verifyDuoLessonType } from '../../../supabase/functions/create-duo-agreements/verifyDuoLessonType';

const LESSON_TYPE_ID = '44444444-4444-4444-4444-444444444444';

function createSupabaseMock(data: unknown, error: { message: string } | null = null) {
	return {
		from: () => ({
			select: () => ({
				eq: () => ({
					maybeSingle: () => Promise.resolve({ data, error }),
				}),
			}),
		}),
	} as unknown as Parameters<typeof verifyDuoLessonType>[0];
}

async function readError(response: Response): Promise<string> {
	const body = (await response.json()) as { error: string };
	return body.error;
}

describe('verifyDuoLessonType', () => {
	it('returns the lesson type when it is an active duo lesson', async () => {
		const lessonType = {
			id: LESSON_TYPE_ID,
			is_duo_lesson: true,
			is_group_lesson: false,
			is_active: true,
		};
		const result = await verifyDuoLessonType(createSupabaseMock(lessonType), LESSON_TYPE_ID);
		expect(result).toEqual({ ok: true, lessonType });
	});

	it('returns 404 when the lesson type is missing', async () => {
		const result = await verifyDuoLessonType(createSupabaseMock(null), LESSON_TYPE_ID);
		expect(result.ok).toBe(false);
		expect((result as { ok: false; response: Response }).response.status).toBe(404);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe('Lessoort niet gevonden');
	});

	it('returns 404 when Supabase returns an error', async () => {
		const result = await verifyDuoLessonType(createSupabaseMock(null, { message: 'db error' }), LESSON_TYPE_ID);
		expect(result.ok).toBe(false);
		expect((result as { ok: false; response: Response }).response.status).toBe(404);
	});

	it('returns 422 when the lesson type is not duo', async () => {
		const result = await verifyDuoLessonType(
			createSupabaseMock({
				id: LESSON_TYPE_ID,
				is_duo_lesson: false,
				is_group_lesson: false,
				is_active: true,
			}),
			LESSON_TYPE_ID,
		);
		expect(result.ok).toBe(false);
		expect((result as { ok: false; response: Response }).response.status).toBe(422);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe(
			'Lessoort is geen duo-lestype',
		);
	});

	it('returns 422 when the lesson type is a group lesson', async () => {
		const result = await verifyDuoLessonType(
			createSupabaseMock({
				id: LESSON_TYPE_ID,
				is_duo_lesson: true,
				is_group_lesson: true,
				is_active: true,
			}),
			LESSON_TYPE_ID,
		);
		expect(result.ok).toBe(false);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe(
			'Lessoort is een groepsles, niet duo',
		);
	});

	it('returns 422 when the lesson type is inactive', async () => {
		const result = await verifyDuoLessonType(
			createSupabaseMock({
				id: LESSON_TYPE_ID,
				is_duo_lesson: true,
				is_group_lesson: false,
				is_active: false,
			}),
			LESSON_TYPE_ID,
		);
		expect(result.ok).toBe(false);
		expect(await readError((result as { ok: false; response: Response }).response)).toBe('Lessoort is niet actief');
	});
});
