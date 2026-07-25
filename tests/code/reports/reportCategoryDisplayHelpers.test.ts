import { describe, expect, it } from 'bun:test';
import { resolveReportCategoryDisplay } from '../../../src/lib/reports/reportCategoryDisplayHelpers';
import type { ReportRow } from '../../../src/types/reports';

const projectRow = {
	source_type: 'project',
	project_name: 'Band Project',
} as ReportRow;

const lessonRow = {
	source_type: 'lesson',
	lesson_type_name: 'Piano',
	lesson_type_icon: 'piano',
	lesson_type_color: '#FF5733',
	duo_perspective: 'teacher_block',
} as ReportRow;

describe('resolveReportCategoryDisplay', () => {
	it('returns project display for project rows', () => {
		expect(resolveReportCategoryDisplay(projectRow)).toEqual({
			kind: 'project',
			projectName: 'Band Project',
		});
	});

	it('returns none when lesson category should not render', () => {
		expect(resolveReportCategoryDisplay({ source_type: 'lesson', lesson_type_name: null } as ReportRow)).toEqual({
			kind: 'none',
		});
	});

	it('returns lesson display with duo perspective labels', () => {
		expect(resolveReportCategoryDisplay(lessonRow)).toEqual({
			kind: 'lesson',
			lessonTypeName: 'Piano',
			lessonTypeIcon: 'piano',
			lessonTypeColor: '#FF5733',
			duoPerspective: 'teacher_block',
			duoPerspectiveLabel: 'docent-blokken',
			duoPerspectiveTitle: 'Duo: 1 lesblok per duo-paar, BTW gesplitst per leerling',
		});
	});
});
