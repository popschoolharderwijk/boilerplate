import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import type { Announcement } from '@/hooks/useAnnouncements';
import { formatDbDateToUi } from '@/lib/date/date-format';

interface AnnouncementAccordionHeaderProps {
	title: string;
	publishedAt: string | null;
	isOpen: boolean;
}

export function AnnouncementAccordionHeader({ title, publishedAt, isOpen }: AnnouncementAccordionHeaderProps) {
	return (
		<>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{title}</p>
				{publishedAt && (
					<p className="text-xs text-muted-foreground">{formatDbDateToUi(publishedAt.slice(0, 10))}</p>
				)}
			</div>
			{isOpen ? (
				<LuChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
			) : (
				<LuChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
			)}
		</>
	);
}

export function getAnnouncementPublishedAt(announcement: Announcement): string | null {
	return announcement.published_at;
}
