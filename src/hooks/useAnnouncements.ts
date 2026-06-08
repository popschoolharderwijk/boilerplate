import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AnnouncementAudience = 'teachers' | 'students';

export interface Announcement {
	id: string;
	title: string;
	body: string;
	audience: AnnouncementAudience[];
	published_at: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

interface UseAnnouncementsOptions {
	/** Only fetch active, published rows visible to the current user (dashboard). */
	publishedOnly?: boolean;
}

export function useAnnouncements({ publishedOnly = false }: UseAnnouncementsOptions = {}) {
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAll = useCallback(async () => {
		setIsLoading(true);
		let query = supabase
			.from('announcements')
			.select('id, title, body, audience, published_at, is_active, created_at, updated_at')
			.order('published_at', { ascending: false, nullsFirst: false })
			.order('created_at', { ascending: false });

		if (publishedOnly) {
			query = query.eq('is_active', true).not('published_at', 'is', null);
		}

		const { data, error: queryError } = await query;
		if (queryError) {
			setError(queryError.message);
			setAnnouncements([]);
		} else {
			setError(null);
			setAnnouncements((data ?? []) as Announcement[]);
		}
		setIsLoading(false);
	}, [publishedOnly]);

	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	return { announcements, isLoading, error, refetch: fetchAll };
}
