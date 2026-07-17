import { useEffect, useState } from 'react';
import { LuMegaphone } from 'react-icons/lu';
import { AnnouncementAccordionItem } from '@/components/dashboard/AnnouncementsSectionParts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import {
	getDefaultExpandedAnnouncementIds,
	toggleExpandedAnnouncementId,
} from '@/lib/dashboard/announcementsSectionHelpers';

export function AnnouncementsSection() {
	const { announcements, isLoading } = useAnnouncements({ publishedOnly: true });
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	useEffect(() => {
		setExpanded(getDefaultExpandedAnnouncementIds(announcements.map((announcement) => announcement.id)));
	}, [announcements]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<LuMegaphone className="h-5 w-5 text-primary" />
						<Skeleton className="h-5 w-32" />
					</div>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-20 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (announcements.length === 0) return null;

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<LuMegaphone className="h-5 w-5 text-primary" />
					Nieuws
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{announcements.map((announcement) => (
					<AnnouncementAccordionItem
						key={announcement.id}
						announcement={announcement}
						isOpen={expanded.has(announcement.id)}
						onToggle={() => setExpanded((prev) => toggleExpandedAnnouncementId(prev, announcement.id))}
					/>
				))}
			</CardContent>
		</Card>
	);
}
