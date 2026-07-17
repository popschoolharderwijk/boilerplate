import { describe, expect, it } from 'bun:test';
import { buildSidebarMainNavItems } from '../../../src/components/layout/sidebarMainNavHelpers';

describe('buildSidebarMainNavItems', () => {
	const baseVisibility = {
		collapsed: false,
		isStudent: false,
		isTeacher: false,
		showTeachersNav: false,
		showStudentsNav: false,
		showReportsNav: false,
		showProjectsNav: false,
		showAdminNav: false,
	};

	it('returns student nav items for students', () => {
		const items = buildSidebarMainNavItems({ ...baseVisibility, isStudent: true });
		expect(items.map((item) => item.key)).toEqual(['my-profile', 'my-trial', 'my-invoices', 'agenda']);
	});

	it('returns dashboard and agenda for non-students', () => {
		const items = buildSidebarMainNavItems(baseVisibility);
		expect(items.map((item) => item.key)).toEqual(['dashboard', 'agenda']);
	});

	it('includes teacher my-students link for teachers without admin teacher nav', () => {
		const items = buildSidebarMainNavItems({ ...baseVisibility, isTeacher: true, showReportsNav: true });
		expect(items.map((item) => item.key)).toEqual(['dashboard', 'agenda', 'my-students', 'reports']);
	});

	it('includes admin operational items when admin nav is visible', () => {
		const items = buildSidebarMainNavItems({ ...baseVisibility, showAdminNav: true });
		expect(items.map((item) => item.href)).toEqual([
			'/',
			'/agenda',
			'/agreements',
			'/lesson-groups',
			'/aanmeldingen',
			'/trial-lessons',
		]);
	});
});
