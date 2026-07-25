import { describe, expect, it } from 'bun:test';
import {
	resolveDuoPerspectiveTitle,
	resolveReportCategorySortValue,
	shouldRenderReportLessonCategory,
} from '../../../src/lib/reports/reportCategoryCellHelpers';
import type { ReportRow } from '../../../src/types/reports';

const projectRow = {
	source_type: 'project',
	project_name: 'Band Project',
} as ReportRow;

const lessonRow = {
	source_type: 'lesson',
	lesson_type_name: 'Piano',
} as ReportRow;

describe('resolveReportCategorySortValue', () => {
	it('sorts by project name for project rows', () => {
		expect(resolveReportCategorySortValue(projectRow)).toBe('band project');
	});

	it('sorts by lesson type name for lesson rows', () => {
		expect(resolveReportCategorySortValue(lessonRow)).toBe('piano');
	});
});

describe('resolveDuoPerspectiveTitle', () => {
	it('returns teacher block title', () => {
		expect(resolveDuoPerspectiveTitle('teacher_block')).toBe(
			'Duo: 1 lesblok per duo-paar, BTW gesplitst per leerling',
		);
	});

	it('returns student pair title', () => {
		expect(resolveDuoPerspectiveTitle('student_lesson')).toBe('Duo: 2 leerling-lessen per duo-paar');
	});
});

describe('shouldRenderReportLessonCategory', () => {
	it('returns false for project rows', () => {
		expect(shouldRenderReportLessonCategory(projectRow)).toBe(false);
	});

	it('returns false when lesson type name is missing', () => {
		expect(shouldRenderReportLessonCategory({ source_type: 'lesson', lesson_type_name: null } as ReportRow)).toBe(
			false,
		);
	});

	it('returns true for lesson rows with a name', () => {
		expect(shouldRenderReportLessonCategory(lessonRow)).toBe(true);
	});
});
