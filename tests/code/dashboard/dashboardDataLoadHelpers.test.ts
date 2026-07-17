import { describe, expect, it } from 'bun:test';
import {
	extractTeacherUserIds,
	shouldLoadDashboardData,
	shouldLoadDashboardTeachers,
} from '../../../src/lib/dashboard/dashboardDataLoadHelpers';

describe('shouldLoadDashboardData', () => {
	it('returns true for privileged users', () => {
		expect(shouldLoadDashboardData(true)).toBe(true);
	});

	it('returns false for non-privileged users', () => {
		expect(shouldLoadDashboardData(false)).toBe(false);
	});
});

describe('extractTeacherUserIds', () => {
	it('extracts user ids from teacher rows', () => {
		expect(extractTeacherUserIds([{ user_id: 'teacher-1' }, { user_id: 'teacher-2' }])).toEqual([
			'teacher-1',
			'teacher-2',
		]);
	});
});

describe('shouldLoadDashboardTeachers', () => {
	it('returns false for empty teacher lists', () => {
		expect(shouldLoadDashboardTeachers([])).toBe(false);
	});

	it('returns true when teacher ids exist', () => {
		expect(shouldLoadDashboardTeachers(['teacher-1'])).toBe(true);
	});
});
