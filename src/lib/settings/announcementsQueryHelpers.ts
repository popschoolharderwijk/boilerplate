function isAnnouncementsSchemaMissingError(error: { code?: string; message: string }): boolean {
	return error.code === 'PGRST205' || error.code === '42P01' || error.message.toLowerCase().includes('announcements');
}

export interface AnnouncementsFetchState {
	isSchemaMissing: boolean;
	error: string | null;
	announcements: unknown[];
}

export function buildAnnouncementsFetchState(
	queryError: { code?: string; message: string } | null,
	data: unknown[] | null,
): AnnouncementsFetchState {
	if (queryError) {
		return {
			isSchemaMissing: isAnnouncementsSchemaMissingError(queryError),
			error: queryError.message,
			announcements: [],
		};
	}
	return {
		isSchemaMissing: false,
		error: null,
		announcements: data ?? [],
	};
}
