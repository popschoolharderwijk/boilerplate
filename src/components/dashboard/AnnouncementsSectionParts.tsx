import { Button } from '@/components/ui/button';
import type { Announcement } from '@/hooks/useAnnouncements';
import { AnnouncementAccordionHeader } from '@/lib/dashboard/announcementsSectionPartsHelpers';
import { renderMarkdown } from '@/lib/markdown/render';
import { cn } from '@/lib/utils';

interface AnnouncementAccordionItemProps {
	announcement: Announcement;
	isOpen: boolean;
	onToggle: () => void;
}

export function AnnouncementAccordionItem({ announcement, isOpen, onToggle }: AnnouncementAccordionItemProps) {
	const publishedAt = announcement.published_at;

	return (
		<div className="rounded-lg border border-border">
			<Button
				type="button"
				variant="ghost"
				onClick={onToggle}
				className={cn(
					'flex h-auto w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left',
					isOpen && 'rounded-b-none border-b border-border',
				)}
				aria-expanded={isOpen}
			>
				<AnnouncementAccordionHeader title={announcement.title} publishedAt={publishedAt} isOpen={isOpen} />
			</Button>
			{isOpen && <div className="px-4 py-3">{renderMarkdown(announcement.body)}</div>}
		</div>
	);
}
