/**
 * Central breadcrumb configuration per route.
 * Uses NAV_LABELS for all labels (DRY with sidebar etc.).
 * For routes with dynamic segments (e.g. /teachers/:id) only the base items
 * are defined here; the page adds the last item via setBreadcrumbSuffix().
 */

import { NAV_LABELS } from './nav-labels';

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

type PathPattern = string | RegExp;

interface RouteBreadcrumb {
	pattern: PathPattern;
	items: BreadcrumbItem[];
}

/** Order matters: more specific routes first (e.g. /teachers/my-profile before /teachers/:id). */
const ROUTE_BREADCRUMBS: RouteBreadcrumb[] = [
	{ pattern: '/', items: [] },
	{ pattern: '/agenda', items: [{ label: NAV_LABELS.agenda, href: '/agenda' }] },
	{ pattern: '/users', items: [{ label: NAV_LABELS.users, href: '/users' }] },
	{
		pattern: '/lesson-types/new',
		items: [
			{ label: NAV_LABELS.lessonTypes, href: '/lesson-types' },
			{ label: 'Nieuwe lessoort', href: '/lesson-types/new' },
		],
	},
	// /lesson-types/:id – base only; page adds lesson type name via suffix
	{
		pattern: /^\/lesson-types\/[^/]+$/,
		items: [{ label: NAV_LABELS.lessonTypes, href: '/lesson-types' }],
	},
	{ pattern: '/lesson-types', items: [{ label: NAV_LABELS.lessonTypes, href: '/lesson-types' }] },
	{ pattern: '/agreements', items: [{ label: NAV_LABELS.agreements, href: '/agreements' }] },
	{ pattern: '/projects', items: [{ label: NAV_LABELS.projects, href: '/projects' }] },
	{
		pattern: /^\/agreements\/[^/]+$/,
		items: [{ label: NAV_LABELS.agreements, href: '/agreements' }],
	},
	{
		pattern: '/account/profile',
		items: [{ label: NAV_LABELS.accountProfile, href: '/account/profile' }],
	},
	{
		pattern: '/account/appearance',
		items: [{ label: NAV_LABELS.accountAppearance, href: '/account/appearance' }],
	},
	{
		pattern: '/account/danger',
		items: [{ label: NAV_LABELS.accountDanger, href: '/account/danger' }],
	},
	{ pattern: '/boekhouding', items: [{ label: NAV_LABELS.accounting, href: '/boekhouding' }] },
	{
		pattern: '/boekhouding/instellingen',
		items: [
			{ label: NAV_LABELS.accounting, href: '/boekhouding' },
			{ label: 'Instellingen', href: '/boekhouding/instellingen' },
		],
	},
	{ pattern: '/data-import', items: [{ label: NAV_LABELS.dataImport, href: '/data-import' }] },
	{ pattern: '/teachers', items: [{ label: NAV_LABELS.teachers, href: '/teachers' }] },
	{
		pattern: '/teachers/availability',
		items: [
			{ label: NAV_LABELS.teachers, href: '/teachers' },
			{ label: NAV_LABELS.availability, href: '/teachers/availability' },
		],
	},
	{
		pattern: '/teachers/my-profile',
		items: [
			{ label: NAV_LABELS.teachers, href: '/teachers' },
			{ label: NAV_LABELS.myProfile, href: '/teachers/my-profile' },
		],
	},
	{
		pattern: '/teachers/my-availability',
		items: [
			{ label: NAV_LABELS.teachers, href: '/teachers' },
			{ label: NAV_LABELS.myAvailability, href: '/teachers/my-availability' },
		],
	},
	{
		pattern: '/teachers/my-statistics',
		items: [
			{ label: NAV_LABELS.teachers, href: '/teachers' },
			{ label: NAV_LABELS.myStatistics, href: '/teachers/my-statistics' },
		],
	},
	// /teachers/:id – base only; page adds teacher name via suffix
	{
		pattern: /^\/teachers\/[^/]+$/,
		items: [{ label: NAV_LABELS.teachers, href: '/teachers' }],
	},
	{ pattern: '/students', items: [{ label: NAV_LABELS.students, href: '/students' }] },
	{
		pattern: '/students/my-students',
		items: [
			{ label: NAV_LABELS.students, href: '/students' },
			{ label: NAV_LABELS.myStudents, href: '/students/my-students' },
		],
	},
	{
		pattern: '/students/my-profile',
		items: [
			{ label: NAV_LABELS.students, href: '/students' },
			{ label: NAV_LABELS.myProfile, href: '/students/my-profile' },
		],
	},
	{ pattern: '/reports', items: [{ label: NAV_LABELS.reports, href: '/reports' }] },
	{ pattern: '/manual', items: [{ label: NAV_LABELS.manual, href: '/manual' }] },
];

function matchesPattern(pathname: string, pattern: PathPattern): boolean {
	if (typeof pattern === 'string') {
		return pathname === pattern;
	}
	return pattern.test(pathname);
}

/**
 * Returns the base breadcrumb items for the given path.
 * For routes with a dynamic title (e.g. teacher name) the page adds
 * extra items via useBreadcrumb().setBreadcrumbSuffix().
 */
export function getBaseBreadcrumb(pathname: string): BreadcrumbItem[] {
	for (const { pattern, items } of ROUTE_BREADCRUMBS) {
		if (matchesPattern(pathname, pattern)) {
			return [...items];
		}
	}
	return [];
}
