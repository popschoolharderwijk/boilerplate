import { LuFolderOpen } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { LessonTypeBadge } from '@/components/ui/lesson-type-badge';
import type { ReportCategoryDisplay } from '@/lib/reports/reportCategoryDisplayHelpers';

export function ReportProjectCategoryBadge({ projectName }: { projectName: string }) {
	return (
		<Badge variant="outline" className="gap-1">
			<LuFolderOpen className="h-3 w-3" />
			{projectName}
		</Badge>
	);
}

export function ReportLessonCategoryBadge({
	display,
}: {
	display: Extract<ReportCategoryDisplay, { kind: 'lesson' }>;
}) {
	return (
		<div className="flex items-center gap-2">
			<LessonTypeBadge
				lessonType={{
					name: display.lessonTypeName,
					icon: display.lessonTypeIcon,
					color: display.lessonTypeColor,
				}}
				size="sm"
			/>
			{display.duoPerspectiveLabel ? (
				<span
					className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
					title={display.duoPerspectiveTitle ?? undefined}
				>
					{display.duoPerspectiveLabel}
				</span>
			) : null}
		</div>
	);
}

export function ReportCategoryDisplayView({ display }: { display: ReportCategoryDisplay }) {
	if (display.kind === 'none') return null;
	if (display.kind === 'project') {
		return <ReportProjectCategoryBadge projectName={display.projectName} />;
	}
	return <ReportLessonCategoryBadge display={display} />;
}
