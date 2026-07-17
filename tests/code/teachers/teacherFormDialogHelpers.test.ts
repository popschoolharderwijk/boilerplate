import { describe, expect, it } from 'bun:test';
import {
	diffLessonTypeIds,
	mapTeachersSortColumn,
	teacherFormFromExistingProfile,
	teacherFormFromTeacher,
} from '../../../src/lib/teachers/teacherFormDialogHelpers';
import type { Teacher } from '../../../src/types/teachers';

describe('teacherFormDialogHelpers', () => {
	it('maps teacher fields with empty fallbacks', () => {
		expect(
			teacherFormFromTeacher({
				email: null,
				first_name: null,
				last_name: 'X',
				phone_number: null,
				bio: null,
			} as unknown as Teacher),
		).toEqual({
			email: '',
			first_name: '',
			last_name: 'X',
			phone_number: '',
			bio: '',
			lesson_type_ids: [],
		});
	});

	it('builds form from existing profile email', () => {
		expect(teacherFormFromExistingProfile('a@b.nl').email).toBe('a@b.nl');
	});

	it('diffs lesson type ids', () => {
		expect(diffLessonTypeIds(['a', 'b'], ['b', 'c'])).toEqual({ toAdd: ['c'], toRemove: ['a'] });
	});

	it('maps teachers sort columns', () => {
		expect(mapTeachersSortColumn(null)).toBe('name');
		expect(mapTeachersSortColumn('teacher')).toBe('name');
		expect(mapTeachersSortColumn('is_active')).toBe('status');
		expect(mapTeachersSortColumn('unknown')).toBe('name');
	});
});
