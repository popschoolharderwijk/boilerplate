import type { MyStudentProfileView } from '@/lib/students/myStudentProfileHelpers';

export type MyStudentProfileRenderedView = 'redirect' | 'skeleton' | 'content';

export function resolveMyStudentProfileRenderedView(
	view: MyStudentProfileView,
	profile: unknown,
): MyStudentProfileRenderedView {
	if (view === 'redirect-missing' || view === 'redirect-empty') return 'redirect';
	if (view === 'skeleton') return 'skeleton';
	if (!profile) return 'redirect';
	return 'content';
}
