import { describe, expect, it } from 'bun:test';
import { resolveMyStudentProfileRenderedView } from '../../../src/lib/students/myStudentProfileViewHelpers';

describe('resolveMyStudentProfileRenderedView', () => {
	it('returns redirect for missing profile redirect views', () => {
		expect(resolveMyStudentProfileRenderedView('redirect-missing', null)).toBe('redirect');
		expect(resolveMyStudentProfileRenderedView('redirect-empty', null)).toBe('redirect');
	});

	it('returns skeleton while loading', () => {
		expect(resolveMyStudentProfileRenderedView('skeleton', null)).toBe('skeleton');
	});

	it('returns redirect when content view has no profile', () => {
		expect(resolveMyStudentProfileRenderedView('content', null)).toBe('redirect');
	});

	it('returns content when profile is available', () => {
		expect(resolveMyStudentProfileRenderedView('content', { id: 'student-1' })).toBe('content');
	});
});
