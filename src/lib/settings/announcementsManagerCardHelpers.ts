export type AnnouncementsManagerCardView = 'schema-missing' | 'loading' | 'empty' | 'list';

export function resolveAnnouncementsManagerCardView(
	isSchemaMissing: boolean,
	isLoading: boolean,
	announcementCount: number,
): AnnouncementsManagerCardView {
	if (isSchemaMissing) return 'schema-missing';
	if (isLoading) return 'loading';
	if (announcementCount === 0) return 'empty';
	return 'list';
}
