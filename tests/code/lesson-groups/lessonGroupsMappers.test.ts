import { describe, expect, it } from 'bun:test';
import { buildMemberMap, mapLessonGroupTableRow } from '../../../src/lib/lesson-groups/lessonGroupsMappers';
import type { LessonGroupRow } from '../../../src/types/lesson-groups';

describe('buildMemberMap', () => {
	it('groups members and fills profile fields', () => {
		const map = buildMemberMap(
			[
				{ lesson_group_id: 'g1', student_user_id: 's1' },
				{ lesson_group_id: 'g1', student_user_id: 's2' },
			],
			new Map([['s1', { user_id: 's1', first_name: 'Ann', last_name: 'A', email: 'a@x.nl' }]]),
		);
		expect(map.get('g1')).toEqual([
			{ user_id: 's1', first_name: 'Ann', last_name: 'A', email: 'a@x.nl' },
			{ user_id: 's2', first_name: null, last_name: null, email: null },
		]);
	});
});

describe('mapLessonGroupTableRow', () => {
	it('maps lesson type and teacher with fallbacks', () => {
		const group = {
			id: 'g1',
			lesson_type_id: 'lt1',
			teacher_user_id: 't1',
			name: 'Band',
		} as LessonGroupRow;
		const mapped = mapLessonGroupTableRow(group, new Map([['lt1', { name: 'Piano' }]]), new Map(), new Map());
		expect(mapped.lesson_type_name).toBe('Piano');
		expect(mapped.teacher_first_name).toBeNull();
		expect(mapped.members).toEqual([]);
	});

	it('uses dash when lesson type is missing', () => {
		const group = {
			id: 'g2',
			lesson_type_id: 'missing',
			teacher_user_id: 't1',
			name: 'Band',
		} as LessonGroupRow;
		const mapped = mapLessonGroupTableRow(group, new Map(), new Map(), new Map());
		expect(mapped.lesson_type_name).toBe('—');
	});
});
