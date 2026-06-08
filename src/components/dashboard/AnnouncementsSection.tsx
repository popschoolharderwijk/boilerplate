import { useEffect, useState } from 'react';
import { LuChevronDown, LuChevronUp, LuMegaphone } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatDbDateToUi } from '@/lib/date/date-format';
import { renderMarkdown } from '@/lib/markdown/render';
import { cn } from '@/lib/utils';

export function AnnouncementsSection() {
	const { announcements, isLoading } = useAnnouncements({ publishedOnly: true });
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (announcements.length > 0) {
			setExpanded(new Set([announcements[0].id]));
		}
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

	const toggle = (id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<LuMegaphone className="h-5 w-5 text-primary" />
					Nieuws
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{announcements.map((a) => {
					const isOpen = expanded.has(a.id);
					return (
						<div key={a.id} className="rounded-lg border border-border">
							<Button
								type="button"
								variant="ghost"
								onClick={() => toggle(a.id)}
								className={cn(
									'flex h-auto w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left',
									isOpen && 'rounded-b-none border-b border-border',
								)}
								aria-expanded={isOpen}
							>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">{a.title}</p>
									{a.published_at && (
										<p className="text-xs text-muted-foreground">
											{formatDbDateToUi(a.published_at.slice(0, 10))}
										</p>
									)}
								</div>
								{isOpen ? (
									<LuChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
								) : (
									<LuChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
								)}
							</Button>
							{isOpen && <div className="px-4 py-3">{renderMarkdown(a.body)}</div>}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
